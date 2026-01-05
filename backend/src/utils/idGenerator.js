import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix = '') => {
    return prefix ? `${prefix}_${uuidv4()}` : uuidv4();
};

export const generateResponseId = () => generateId('RES');
export const generateFormId = () => generateId('FORM');
export const generateRequestId = () => generateId('REQ');
export const generateAdminId = () => generateId('ADMIN');
