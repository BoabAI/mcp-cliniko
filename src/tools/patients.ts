import { z } from 'zod';
import { ClinikoClient } from '../cliniko-client.js';

const PatientCreateSchema = z.object({
  first_name: z.string().describe('Patient first name'),
  last_name: z.string().describe('Patient last name'),
  title: z.string().optional().describe('Title (Mr, Ms, Dr, etc)'),
  preferred_name: z.string().optional().describe('Preferred name'),
  date_of_birth: z.string().optional().describe('Date of birth (YYYY-MM-DD)'),
  sex: z.enum(['Male', 'Female', 'Other']).optional().describe('Biological sex'),
  email: z.string().email().optional().describe('Email address'),
  phone_number: z.string().optional().describe('Primary phone number'),
  address_line_1: z.string().optional().describe('Address line 1'),
  address_line_2: z.string().optional().describe('Address line 2'),
  suburb: z.string().optional().describe('Suburb/City'),
  postcode: z.string().optional().describe('Postcode'),
  state: z.string().optional().describe('State/Province'),
  country: z.string().optional().describe('Country'),
  medicare_number: z.string().optional().describe('Medicare number'),
  medicare_reference_number: z.string().optional().describe('Medicare reference number'),
});

const PatientUpdateSchema = PatientCreateSchema.partial();

const PatientSearchSchema = z.object({
  q: z.string().optional().describe('Search query (searches name, email, phone)'),
  page: z.number().optional().describe('Page number'),
  per_page: z.number().optional().describe('Results per page (max 100)'),
});

export function registerPatientTools(server: any, client: ClinikoClient) {
  // List/Search patients
  server.tool('list_patients', {
    description: 'List or search for patients',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query (searches name, email, phone)' },
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page (max 100)' }
      }
    },
  }, async ({ q, page, per_page }: z.infer<typeof PatientSearchSchema>) => {
    try {
      const response = await client.listPatients({ q, page, per_page });
      const patients = response.patients || [];
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            patients,
            total_entries: response.total_entries,
            page: page || 1,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to list patients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Get patient by ID
  server.tool('get_patient', {
    description: 'Get a specific patient by ID',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Patient ID' }
      },
      required: ['patient_id']
    },
  }, async ({ patient_id }: { patient_id: number }) => {
    try {
      const patient = await client.getPatient(patient_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(patient, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Create patient
  server.tool('create_patient', {
    description: 'Create a new patient',
    inputSchema: {
      type: 'object',
      properties: {
        first_name: { type: 'string', description: 'Patient first name' },
        last_name: { type: 'string', description: 'Patient last name' },
        title: { type: 'string', description: 'Title (Mr, Ms, Dr, etc)' },
        preferred_name: { type: 'string', description: 'Preferred name' },
        date_of_birth: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
        sex: { type: 'string', enum: ['Male', 'Female', 'Other'], description: 'Biological sex' },
        email: { type: 'string', description: 'Email address' },
        phone_number: { type: 'string', description: 'Primary phone number' },
        address_line_1: { type: 'string', description: 'Address line 1' },
        address_line_2: { type: 'string', description: 'Address line 2' },
        suburb: { type: 'string', description: 'Suburb/City' },
        postcode: { type: 'string', description: 'Postcode' },
        state: { type: 'string', description: 'State/Province' },
        country: { type: 'string', description: 'Country' },
        medicare_number: { type: 'string', description: 'Medicare number' },
        medicare_reference_number: { type: 'string', description: 'Medicare reference number' }
      },
      required: ['first_name', 'last_name']
    },
  }, async (input: z.infer<typeof PatientCreateSchema>) => {
    try {
      const patientData: any = {
        first_name: input.first_name,
        last_name: input.last_name,
      };

      if (input.title) patientData.title = input.title;
      if (input.preferred_name) patientData.preferred_name = input.preferred_name;
      if (input.date_of_birth) patientData.date_of_birth = input.date_of_birth;
      if (input.sex) patientData.sex = input.sex;
      if (input.email) patientData.email = input.email;
      if (input.medicare_number) patientData.medicare_number = input.medicare_number;
      if (input.medicare_reference_number) patientData.medicare_reference_number = input.medicare_reference_number;

      // Handle phone numbers
      if (input.phone_number) {
        patientData.phone_numbers = [{
          number: input.phone_number,
          type: 'Mobile'
        }];
      }

      // Handle address
      if (input.address_line_1 || input.suburb || input.postcode) {
        patientData.address = {};
        if (input.address_line_1) patientData.address.line_1 = input.address_line_1;
        if (input.address_line_2) patientData.address.line_2 = input.address_line_2;
        if (input.suburb) patientData.address.suburb = input.suburb;
        if (input.postcode) patientData.address.postcode = input.postcode;
        if (input.state) patientData.address.state = input.state;
        if (input.country) patientData.address.country = input.country;
      }

      const patient = await client.createPatient(patientData);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(patient, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to create patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Update patient
  server.tool('update_patient', {
    description: 'Update an existing patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Patient ID' },
        first_name: { type: 'string', description: 'Patient first name' },
        last_name: { type: 'string', description: 'Patient last name' },
        title: { type: 'string', description: 'Title (Mr, Ms, Dr, etc)' },
        preferred_name: { type: 'string', description: 'Preferred name' },
        date_of_birth: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
        sex: { type: 'string', enum: ['Male', 'Female', 'Other'], description: 'Biological sex' },
        email: { type: 'string', description: 'Email address' },
        phone_number: { type: 'string', description: 'Primary phone number' },
        address_line_1: { type: 'string', description: 'Address line 1' },
        address_line_2: { type: 'string', description: 'Address line 2' },
        suburb: { type: 'string', description: 'Suburb/City' },
        postcode: { type: 'string', description: 'Postcode' },
        state: { type: 'string', description: 'State/Province' },
        country: { type: 'string', description: 'Country' },
        medicare_number: { type: 'string', description: 'Medicare number' },
        medicare_reference_number: { type: 'string', description: 'Medicare reference number' }
      },
      required: ['patient_id']
    },
  }, async (input: any) => {
    try {
      const { patient_id, ...updateData } = input;
      const patientData: any = {};

      // Map simple fields
      if (updateData.first_name) patientData.first_name = updateData.first_name;
      if (updateData.last_name) patientData.last_name = updateData.last_name;
      if (updateData.title) patientData.title = updateData.title;
      if (updateData.preferred_name) patientData.preferred_name = updateData.preferred_name;
      if (updateData.date_of_birth) patientData.date_of_birth = updateData.date_of_birth;
      if (updateData.sex) patientData.sex = updateData.sex;
      if (updateData.email) patientData.email = updateData.email;
      if (updateData.medicare_number) patientData.medicare_number = updateData.medicare_number;
      if (updateData.medicare_reference_number) patientData.medicare_reference_number = updateData.medicare_reference_number;

      // Handle phone numbers
      if (updateData.phone_number) {
        patientData.phone_numbers = [{
          number: updateData.phone_number,
          type: 'Mobile'
        }];
      }

      // Handle address
      if (updateData.address_line_1 || updateData.suburb || updateData.postcode) {
        patientData.address = {};
        if (updateData.address_line_1) patientData.address.line_1 = updateData.address_line_1;
        if (updateData.address_line_2) patientData.address.line_2 = updateData.address_line_2;
        if (updateData.suburb) patientData.address.suburb = updateData.suburb;
        if (updateData.postcode) patientData.address.postcode = updateData.postcode;
        if (updateData.state) patientData.address.state = updateData.state;
        if (updateData.country) patientData.address.country = updateData.country;
      }

      const patient = await client.updatePatient(patient_id, patientData);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(patient, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to update patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Delete (archive) patient
  server.tool('delete_patient', {
    description: 'Delete (archive) a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Patient ID' }
      },
      required: ['patient_id']
    },
  }, async ({ patient_id }: { patient_id: number }) => {
    try {
      await client.deletePatient(patient_id);
      return {
        content: [{
          type: 'text',
          text: `Patient ${patient_id} has been archived successfully`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to delete patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}