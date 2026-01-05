import express from 'express';
import School from '../models/School.js';
import multer from 'multer';
import xlsx from 'xlsx';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// @route   GET /api/schools/by-udise/:udiseCode
// @desc    Get school by UDISE code
// @access  Public
router.get('/schools/by-udise/:udiseCode', async (req, res) => {
    try {
        const school = await School.findOne({ udiseCode: req.params.udiseCode });

        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        res.json(school);
    } catch (error) {
        console.error('Error fetching school:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/schools/by-location
// @desc    Get schools by district and taluka
// @access  Public
router.get('/schools/by-location', async (req, res) => {
    try {
        const { district, taluka } = req.query;

        const query = {};
        if (district) query.districtName = district;
        if (taluka) query.talukaName = taluka;

        const schools = await School.find(query).sort({ schoolName: 1 });
        res.json(schools);
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/schools/search
// @desc    Search schools by name or UDISE
// @access  Public
router.get('/schools/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query required' });
        }

        const schools = await School.find({
            $or: [
                { schoolName: { $regex: q, $options: 'i' } },
                { udiseCode: { $regex: q, $options: 'i' } },
                { hodName: { $regex: q, $options: 'i' } },
            ],
        }).limit(20);

        res.json(schools);
    } catch (error) {
        console.error('Error searching schools:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/districts
// @desc    Get all unique districts
// @access  Public
router.get('/districts', async (req, res) => {
    try {
        const districts = await School.distinct('districtName');
        res.json(districts.sort());
    } catch (error) {
        console.error('Error fetching districts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/talukas/:districtName
// @desc    Get all talukas in a district
// @access  Public
router.get('/talukas/:districtName', async (req, res) => {
    try {
        const talukas = await School.distinct('talukaName', {
            districtName: req.params.districtName,
        });
        res.json(talukas.sort());
    } catch (error) {
        console.error('Error fetching talukas:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/schools/import
// @desc    Import schools from Excel
// @access  Private (Admin)
router.post('/admin/schools/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Parse Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const results = {
            success: 0,
            errors: 0,
            duplicates: 0,
            errorDetails: [], // Store detailed error information
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                const schoolData = {
                    udiseCode: String(row['UDISE Code'] || row.udiseCode || '').trim(),
                    schoolName: String(row['School Name'] || row.schoolName || '').trim(),
                    districtName: String(row['District Name'] || row.districtName || '').trim(),
                    talukaName: String(row['Taluka Name'] || row.talukaName || '').trim(),
                    hodName: String(row['HOD Name'] || row.hodName || '').trim(),
                    hodPhone: String(row['HOD Phone'] || row.hodPhone || '').trim(),
                };

                // Validate required fields
                const missingFields = [];
                if (!schoolData.udiseCode) missingFields.push('UDISE Code');
                if (!schoolData.schoolName) missingFields.push('School Name');
                if (!schoolData.districtName) missingFields.push('District Name');
                if (!schoolData.talukaName) missingFields.push('Taluka Name');
                if (!schoolData.hodName) missingFields.push('HOD Name');
                if (!schoolData.hodPhone) missingFields.push('HOD Phone');

                if (missingFields.length > 0) {
                    results.errors++;
                    results.errorDetails.push({
                        row: i + 2, // Excel row (header is row 1)
                        udiseCode: schoolData.udiseCode || 'N/A',
                        error: `Missing required fields: ${missingFields.join(', ')}`,
                    });
                    continue;
                }

                // Validate UDISE code format (11 digits)
                if (!/^\d{11}$/.test(schoolData.udiseCode)) {
                    results.errors++;
                    results.errorDetails.push({
                        row: i + 2,
                        udiseCode: schoolData.udiseCode,
                        error: 'UDISE Code must be exactly 11 digits',
                    });
                    continue;
                }

                // Validate phone number (10 digits)
                if (!/^\d{10}$/.test(schoolData.hodPhone)) {
                    results.errors++;
                    results.errorDetails.push({
                        row: i + 2,
                        udiseCode: schoolData.udiseCode,
                        error: 'HOD Phone must be exactly 10 digits',
                    });
                    continue;
                }

                // Check if school already exists
                const existing = await School.findOne({ udiseCode: schoolData.udiseCode });

                if (existing) {
                    results.duplicates++;
                    continue;
                }

                // Create new school
                await School.create(schoolData);
                results.success++;
            } catch (error) {
                console.error('Error importing row:', error);
                results.errors++;
                results.errorDetails.push({
                    row: i + 2,
                    udiseCode: row['UDISE Code'] || row.udiseCode || 'N/A',
                    error: error.message || 'Unknown error',
                });
            }
        }

        res.json({
            message: 'Import completed',
            results,
        });
    } catch (error) {
        console.error('Error importing schools:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/schools/create
// @desc    Create a single school manually
// @access  Private (Admin)
router.post('/admin/schools/create', async (req, res) => {
    try {
        const { udiseCode, schoolName, districtName, talukaName, hodName, hodPhone } = req.body;

        // Validation
        if (!udiseCode || !schoolName || !districtName || !talukaName || !hodName || !hodPhone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!/^\d{11}$/.test(udiseCode)) {
            return res.status(400).json({ message: 'UDISE Code must be exactly 11 digits' });
        }

        if (!/^\d{10}$/.test(hodPhone)) {
            return res.status(400).json({ message: 'HOD Phone must be exactly 10 digits' });
        }

        // Check if school exists
        const existingSchool = await School.findOne({ udiseCode });
        if (existingSchool) {
            return res.status(400).json({ message: 'School with this UDISE Code already exists' });
        }

        // Create school
        const newSchool = new School({
            udiseCode,
            schoolName,
            districtName,
            talukaName,
            hodName,
            hodPhone
        });

        await newSchool.save();

        res.status(201).json({ message: 'School created successfully', school: newSchool });
    } catch (error) {
        console.error('Error creating school:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/schools/update/:udiseCode
// @desc    Update school HOD details
// @access  Public (Used by users/HODs)
router.put('/schools/update/:udiseCode', async (req, res) => {
    try {
        const { hodName, hodPhone } = req.body;
        const { udiseCode } = req.params;

        if (!hodName || !hodPhone) {
            return res.status(400).json({ message: 'HOD Name and Phone are required' });
        }

        if (!/^\d{10}$/.test(hodPhone)) {
            return res.status(400).json({ message: 'HOD Phone must be exactly 10 digits' });
        }

        const school = await School.findOne({ udiseCode });

        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        school.hodName = hodName;
        school.hodPhone = hodPhone;

        await school.save();

        res.json({ message: 'School details updated successfully', school });
    } catch (error) {
        console.error('Error updating school:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
