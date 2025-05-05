export const formatTimeForDisplay = (timeDate) => {
    if (!timeDate) return '';
    
    // Ensure we're working with a Date object
    const date = new Date(timeDate);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  export const generateTimeSlots = async (employee, service, selectedDate) => {
    // Validate input parameters
    if (!employee || !service || !selectedDate) {
      console.log('Missing required parameters:', { employee: !!employee, service: !!service, selectedDate: !!selectedDate });
      return [];
    }
  
    // Get employee's availability for the selected day
    const utcDate = new Date(selectedDate.toISOString());
// Use local day to match availability storage
const dayOfWeek = selectedDate.getDay();
    console.log('Checking availability for day:', dayOfWeek);
    
    // Ensure we're comparing the same types (number to number)
    const availability = employee.availability?.find(a => Number(a.day_of_week) === Number(dayOfWeek));
    console.log('Found availability:', availability);
    
    // Check if the day is available and enabled
    if (!availability) {
      console.log('No availability record found for this day');
      return [];
    }
    
    if (!availability.enabled) {
      console.log('Day is not enabled in employee schedule');
      return [];
    }
    
    if (!availability.start_time || !availability.end_time) {
      console.log('Missing start or end time in availability');
      return [];
    }
  
    // Create a new date object for the selected date with time set to midnight in local timezone
    // Create base date in local timezone
const startTime = new Date(selectedDate);
startTime.setHours(0, 0, 0, 0);
    let startHours, startMinutes;
    
    // Parse start time from different possible formats
    if (typeof availability.start_time === 'string') {
      // Parse UTC time string and convert to local time
      const [utcHours, utcMinutes] = availability.start_time.split(':').map(Number);
      const utcDate = new Date(Date.UTC(1970, 0, 1, utcHours, utcMinutes));
      startHours = utcDate.getHours();
      startMinutes = utcDate.getMinutes();
      console.log('Parsed start time from UTC string:', availability.start_time, '-> Local:', startHours, startMinutes);
    } else if (availability.start_time instanceof Date) {
      // Convert stored UTC Date to local time
      startHours = availability.start_time.getUTCHours();
      startMinutes = availability.start_time.getUTCMinutes();
      console.log('Parsed start time from UTC Date:', availability.start_time.toISOString(), '-> Local:', startHours, startMinutes);
    } else {
      console.log('Invalid start time format:', availability.start_time);
      return [];
    }
    
    startTime.setUTCHours(startHours, startMinutes, 0, 0);
    console.log('Start time set to:', startTime.toLocaleString());
  
    const endTime = new Date(selectedDate);
endTime.setHours(0, 0, 0, 0);
    let endHours, endMinutes;
    
    // Parse end time from different possible formats
    if (typeof availability.end_time === 'string') {
      // Parse UTC time string and convert to local time
      const [utcHours, utcMinutes] = availability.end_time.split(':').map(Number);
      const utcDate = new Date(Date.UTC(1970, 0, 1, utcHours, utcMinutes));
      endHours = utcDate.getHours();
      endMinutes = utcDate.getMinutes();
      console.log('Parsed end time from UTC string:', availability.end_time, '-> Local:', endHours, endMinutes);
    } else if (availability.end_time instanceof Date) {
      // Convert stored UTC Date to local time
      endHours = availability.end_time.getUTCHours();
      endMinutes = availability.end_time.getUTCMinutes();
      console.log('Parsed end time from UTC Date:', availability.end_time.toISOString(), '-> Local:', endHours, endMinutes);
    } else {
      console.log('Invalid end time format:', availability.end_time);
      return [];
    }
    
    endTime.setUTCHours(endHours, endMinutes, 0, 0);
    console.log('End time set to:', endTime.toLocaleString());
    
    // Ensure we have a valid time range
    if (startTime >= endTime) {
      console.log('Invalid time range: start time is after or equal to end time');
      return [];
    }
  
    // Check for existing appointments to avoid overlaps
    try {
      // Use the BASE_URL constant from appointmentsApi.js if possible
      // Otherwise, construct it from environment variables
      let BASE_URL;
      try {
        // Try to use the same BASE_URL as in appointmentsApi.js
        BASE_URL = import.meta.env.VITE_API_URL || '';
        if (!BASE_URL) {
          console.error('VITE_API_URL environment variable is not defined');
          return [];
        }
      } catch (error) {
        console.error('Error accessing environment variables:', error);
        return [];
      }
      
      // Ensure we have a properly formatted URL by removing any trailing slashes
      const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
      const apiUrl = `${baseUrlFormatted}/api/appointments?employee_id=${employee.id}`;
      console.log('Fetching appointments from:', apiUrl);
      
      // Fetch existing appointments
      let response;
      try {
        response = await fetch(apiUrl);
        if (!response.ok) {
          console.error('Failed to fetch appointments:', response.status, response.statusText);
          return [];
        }
        
        const existingAppointments = await response.json();
      
      // Filter appointments for the selected date without timezone adjustments
      // Use local date for appointment filtering
const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      console.log('Selected date string for filtering:', selectedDateStr);
      
      const appointmentsOnDate = existingAppointments.filter(app => {
        // Ensure we're working with Date objects
        const appStartTime = new Date(app.start_time);
        
        // Format date for comparison
        // Convert appointment time to local timezone for comparison
const appLocalTime = new Date(appStartTime.toLocaleString());
const appDateStr = `${appLocalTime.getFullYear()}-${String(appLocalTime.getMonth() + 1).padStart(2, '0')}-${String(appLocalTime.getDate()).padStart(2, '0')}`;
        const matches = appDateStr === selectedDateStr;
        
        if (matches) {
          console.log('Found appointment on selected date:', app.id, new Date(app.start_time).toLocaleString(), 'to', new Date(app.end_time).toLocaleString());
        }
        return matches;
      });
      
      console.log('Appointments on selected date:', appointmentsOnDate.length);
      
      // Generate available time slots
      const slots = [];
      const currentTime = new Date(startTime);
      const serviceDuration = parseInt(service.duration, 10);
      console.log('Service duration:', serviceDuration, 'minutes');
      
      // Use 15-minute intervals or the service duration if it's shorter
      const intervalMinutes = Math.min(15, serviceDuration);
      console.log('Using interval of', intervalMinutes, 'minutes');

      // Get current time for today's slots
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      if (isToday) {
        console.log('Selected date is today, current time is:', now.toLocaleTimeString());
        
        // If today, ensure we start from current time (rounded up to next interval)
        if (currentTime < now) {
          const minutesToAdd = intervalMinutes - (now.getMinutes() % intervalMinutes);
          const adjustedTime = new Date(now.getTime() + minutesToAdd * 60000);
          adjustedTime.setSeconds(0, 0); // Reset seconds and milliseconds
          
          // Only update if the adjusted time is still before end time
          if (adjustedTime < endTime) {
            currentTime.setHours(adjustedTime.getHours(), adjustedTime.getMinutes(), 0, 0);
            console.log('Adjusted start time to current time:', currentTime.toLocaleTimeString());
          } else {
            console.log('Current time is after available hours');
            return [];
          }
        }
      }
  
      // Generate time slots
      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);
        
        // We already adjusted the current time for today's slots above,
        // so we don't need this check anymore
        
        // Check if the slot fits within the availability window
        if (slotEndTime <= endTime) {
          // Check if the slot overlaps with any existing appointment
          const isOverlapping = appointmentsOnDate.some(app => {
            // Ensure we're working with Date objects
            const appStart = new Date(app.start_time);
            const appEnd = new Date(app.end_time);
            
            // Check for overlap
            const overlaps = (
              (currentTime >= appStart && currentTime < appEnd) || // Slot start during appointment
              (slotEndTime > appStart && slotEndTime <= appEnd) || // Slot end during appointment
              (currentTime <= appStart && slotEndTime >= appEnd) // Slot contains appointment
            );
            
            if (overlaps) {
              console.log('Slot', currentTime.toLocaleTimeString(), 'overlaps with appointment', 
                appStart.toLocaleTimeString(), 'to', appEnd.toLocaleTimeString());
            }
            
            return overlaps;
          });
          
          // Add slot if it doesn't overlap with any existing appointment
          if (!isOverlapping) {
            // Create a new Date object to avoid reference issues
            slots.push(new Date(currentTime));
            console.log('Added available slot:', currentTime.toLocaleTimeString());
          }
        } else {
          console.log('Slot end time exceeds availability end time:', slotEndTime.toLocaleTimeString());
        }
        
        // Move to the next interval
        currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
      }
      
      // Log results
      console.log('Generated available time slots:', slots.length);
      if (slots.length === 0) {
        console.log('No available time slots found for the selected date');
      } else {
        console.log('First available slot:', slots[0].toLocaleTimeString());
        console.log('Last available slot:', slots[slots.length - 1].toLocaleTimeString());
      }
      
      return slots;
    } catch (error) {
      console.error('Error checking existing appointments:', error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching existing appointments:', error);
    return [];
  }
}
  export const getAvailableDates = (employee, service) => {
    if (!employee || !service) return [];
    
    // Get the next 30 days
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start from beginning of today
    
    // Check the next 30 days for availability
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Check if employee works on this day, including Sunday (day 0)
      const dayOfWeek = date.getDay();
      // Use optional chaining safely with native JS methods
      const availability = employee.availability ? employee.availability.find(a => a.day_of_week === dayOfWeek) : null;
      
      // Ensure the day is available, enabled, and has valid start/end times
      if (availability && availability.enabled && availability.start_time && availability.end_time) {
        // Parse start time
        let startHours, startMinutes;
        if (typeof availability.start_time === 'string') {
          [startHours, startMinutes] = availability.start_time.split(':').map(Number);
        } else if (availability.start_time instanceof Date) {
          startHours = availability.start_time.getHours();
          startMinutes = availability.start_time.getMinutes();
        } else {
          continue; // Skip this day if start time is invalid
        }
        
        // Parse end time
        let endHours, endMinutes;
        if (typeof availability.end_time === 'string') {
          [endHours, endMinutes] = availability.end_time.split(':').map(Number);
        } else if (availability.end_time instanceof Date) {
          endHours = availability.end_time.getHours();
          endMinutes = availability.end_time.getMinutes();
        } else {
          continue; // Skip this day if end time is invalid
        }
        
        const startTime = new Date(date);
        startTime.setUTCHours(startHours, startMinutes, 0, 0);
        
        const endTime = new Date(date);
        endTime.setUTCHours(endHours, endMinutes, 0, 0);
        
        // Check if there's enough time for at least one appointment
        const serviceDuration = parseInt(service.duration, 10);
        if (endTime.getTime() - startTime.getTime() >= serviceDuration * 60000) {
          // For past dates, only include if they're today and it's before the end time
          const now = new Date();
          if (date.getDate() === now.getDate() && 
              date.getMonth() === now.getMonth() && 
              date.getFullYear() === now.getFullYear()) {
            // It's today, check if current time is before end time
            if (now.getHours() < endHours || 
                (now.getHours() === endHours && now.getMinutes() < endMinutes)) {
              dates.push(new Date(date));
            }
          } else if (date > now) {
            // Future date
            dates.push(new Date(date));
          }
        }
      }
    }
    
    return dates;
  };
