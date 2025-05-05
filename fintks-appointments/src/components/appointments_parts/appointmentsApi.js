const BASE_URL = import.meta.env.VITE_API_URL + '/api';

/**
 * Fetches services from the API.
 * @returns {Promise<Array>} Array of services.
 */
export const fetchServices = async () => {
  try {
    const response = await fetch(`${BASE_URL}/services`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Fetches employees from the API.
 * @returns {Promise<Array>} Array of employees.
 */
export const fetchEmployees = async () => {
  try {
    const response = await fetch(`${BASE_URL}/employees`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

/**
 * Fetches appointments for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array>} Array of appointments.
 */
export const fetchAppointments = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/appointments?user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.map(appointment => {
      // Create date objects without timezone adjustments
      const start = new Date(appointment.start_time);
      const end = new Date(appointment.end_time);
      
      return {
        ...appointment,
        start_time: start,
        end_time: end,
        // Ensure meetingInfo is preserved
        meetingInfo: appointment.meetingInfo || null
      };
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

/**
 * Fetches appointments for a specific employee.
 * @param {number} employeeId - The ID of the employee.
 * @returns {Promise<Array>} Array of appointments.
 */
export const fetchEmployeeAppointments = async (employeeId) => {
  try {
    const response = await fetch(`${BASE_URL}/appointments?employee_id=${employeeId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.map(appointment => {
      // Create date objects without timezone adjustments
      const start = new Date(appointment.start_time);
      const end = new Date(appointment.end_time);
      
      return {
        ...appointment,
        start_time: start,
        end_time: end,
        // Preserve user_name and service_name from the backend
        user_name: appointment.user_name,
        service_name: appointment.service_name,
        // Ensure meetingInfo is preserved
        meetingInfo: appointment.meetingInfo || null
      };
    });
  } catch (error) {
    console.error('Error fetching employee appointments:', error);
    return [];
  }
};

/**
 * Fetches availability for a specific employee.
 * @param {number} employeeId - The ID of the employee.
 * @returns {Promise<Object>} Availability map for the employee.
 */
export const fetchEmployeeAvailability = async (employeeId) => {
  try {
    const response = await fetch(`${BASE_URL}/employees/${employeeId}/availability`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    // Process the availability data
    const availabilityMap = data.reduce((acc, avail) => {
      if (avail.start_time && avail.end_time) {
        const dayKey = avail.day_of_week.toString();
        acc[dayKey] = {
          ...avail,
          enabled: true,
          start_time: avail.start_time,
          end_time: avail.end_time,
        };
      }
      return acc;
    }, {});

    return availabilityMap;
  } catch (error) {
    console.error('Error fetching employee availability:', error);
    return {};
  }
};

/**
 * Saves an appointment (creates or updates).
 * @param {Object} user - The user object.
 * @param {Object} formData - The form data containing appointment details.
 * @param {Array} services - Array of available services.
 * @param {Object} [selectedAppointment] - The appointment to update (if any).
 * @returns {Promise<Object>} The saved appointment data.
 */
export const saveAppointment = async (user, formData, services, selectedAppointment) => {
  try {
    const url = selectedAppointment
      ? `${BASE_URL}/appointments/${selectedAppointment.id}`
      : `${BASE_URL}/appointments`;

    const service = services.find((s) => s.id === formData.service_id);

    // Use the start_time Date object directly from formData
    const startTime = formData.start_time;
    
    // Calculate end time based on service duration
    const endTime = new Date(startTime.getTime() + parseInt(service.duration, 10) * 60000);

    // Format dates in ISO format
    const startTimeISO = startTime.toISOString();
    const endTimeISO = endTime.toISOString();

    const method = selectedAppointment ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        user_id: user.id,
        service_id: formData.service_id,
        employee_id: formData.employee_id,
        start_time: startTimeISO,
        end_time: endTimeISO,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save appointment');
    }

    return data;
  } catch (error) {
    console.error('Error saving appointment:', error);
    throw error;
  }
};

/**
 * Deletes an appointment.
 * @param {number} appointmentId - The ID of the appointment to delete.
 * @returns {Promise<boolean>} True if deletion was successful.
 */
export const deleteAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${BASE_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error);
    }

    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

/**
 * Updates the status of an appointment.
 * @param {number} appointmentId - The ID of the appointment to update.
 * @param {string} status - The new status ('pending', 'confirmed', 'cancelled', 'completed').
 * @param {string} [cancellationNote] - Optional note explaining why the appointment was cancelled.
 * @returns {Promise<Object>} The updated appointment data.
 */
export const updateAppointmentStatus = async (appointmentId, status, cancellationNote = null) => {
  try {
    const url = `${BASE_URL}/appointments/${appointmentId}/status`;
    const body = { status };
    
    // Add cancellation note if provided and status is 'cancelled'
    if (status === 'cancelled' && cancellationNote) {
      body.cancellation_note = cancellationNote;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update appointment status');
    }

    return data;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};
