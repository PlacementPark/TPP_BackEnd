/**
 * Utility functions for role PDF generation
 */

/**
 * Sanitize a string value for PDF display
 * Handles null, undefined, and empty values
 * @param {any} value - The value to sanitize
 * @returns {string} - Sanitized string or 'N/A'
 */
const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? "N/A" : trimmed;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "N/A";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return String(value);
};

/**
 * Format a boolean status for display
 * @param {boolean} value - The boolean value
 * @returns {string} - Formatted status string
 */
const formatStatus = (value) => {
  return value ? "Active" : "Inactive";
};

/**
 * Format mobile numbers array
 * @param {string[]} mobiles - Array of mobile numbers
 * @returns {string} - Formatted mobile string
 */
const formatMobiles = (mobiles) => {
  if (!mobiles || !Array.isArray(mobiles)) {
    return "N/A";
  }
  const filtered = mobiles.filter((m) => m && m.trim() !== "");
  return filtered.length > 0 ? filtered.join(", ") : "N/A";
};

/**
 * Get section data for PDF generation
 * @param {Object} company - Company object
 * @param {Object} role - Role object
 * @returns {Object} - Organized sections for PDF
 */
const getRolePdfData = (company, role) => {
  return {
    company: {
      name: sanitizeValue(company.companyName),
      hrName: sanitizeValue(company.HRName),
      hrEmail: sanitizeValue(company.HREmail),
      hrMobile: formatMobiles(company.HRMobile),
    },
    role: {
      designation: sanitizeValue(role.designation),
      status: formatStatus(role.status),
      processType: sanitizeValue(role.processType),
      period: sanitizeValue(role.period),
      industry: sanitizeValue(role.industry),
      experience: sanitizeValue(role.experience),
      salary: sanitizeValue(role.salary),
      shift: sanitizeValue(role.shift),
      bond: sanitizeValue(role.bond),
      ageCriteria: sanitizeValue(role.ageCriteria),
      cabFacility: sanitizeValue(role.cabFacility),
      processWorkType: sanitizeValue(role.processWorkType),
    },
    location: {
      locations: sanitizeValue(role.location),
      area: sanitizeValue(role.area),
    },
    skills: {
      mandatory: sanitizeValue(role.mandatorySkills),
      optional: sanitizeValue(role.optionalSkills),
    },
    qualifications: {
      list: sanitizeValue(role.qualification),
    },
    additional: {
      happens: sanitizeValue(role.happens),
      otherDocs: sanitizeValue(role.otherDocs),
    },
  };
};

module.exports = {
  sanitizeValue,
  formatStatus,
  formatMobiles,
  getRolePdfData,
};
