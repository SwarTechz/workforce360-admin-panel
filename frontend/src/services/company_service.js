import api from "@/config/axios";

const VALID_STATUS = new Set(["approved", "unapproved", "draft"]);

const isNonEmptyValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
};

const buildSafeQueryParams = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!isNonEmptyValue(value)) return;
    query.append(key, String(value));
  });

  return query.toString();
};

const extractApiData = (response) => response?.data?.data ?? null;

const buildListParams = (params = {}) => {
  const hasCursor = isNonEmptyValue(params.cursor);
  const safePage = Math.max(1, Number(params.page) || 1);

  return {
    page: hasCursor ? null : safePage,
    page_size: params.page_size,
    cursor: hasCursor ? params.cursor : null,
    search_term: params.search_term,
    search_type: params.search_type,
  };
};

const safeApiError = (error, fallbackMessage) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage ||
    "Something went wrong. Please try again.";

  const safeError = new Error(message);
  safeError.originalError = error;
  return safeError;
};

// Get companies by status with search + hybrid pagination and cancellation support
export const getCompaniesByStatus = async (
  status = "approved",
  options = {},
) => {
  const safeStatus = VALID_STATUS.has(status) ? status : "approved";
  const queryString = buildSafeQueryParams(
    buildListParams(options.params || {}),
  );
  const endpoint = queryString
    ? `/admin_panel_company/${safeStatus}?${queryString}`
    : `/admin_panel_company/${safeStatus}`;

  try {
    const response = await api.get(endpoint, {
      signal: options.signal,
    });
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, `Failed to load ${safeStatus} companies.`);
  }
};

// Get Company by ID from admin panel routes
export const getCompanyById = async (companyId) => {
  try {
    const response = await api.get(`/admin_panel_company/${companyId}`);
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to load company details.");
  }
};

// Approve Company
export const approveCompany = async (companyId) => {
  try {
    const response = await api.patch(
      `/admin_panel_company/approve_company_profile/${companyId}`,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to approve company.");
  }
};

// Unapprove Company
export const unapproveCompany = async (companyId) => {
  try {
    const response = await api.patch(
      `/admin_panel_company/unapprove/${companyId}`,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to unapprove company.");
  }
};

// Reject Company
export const rejectCompany = async (companyId) => {
  try {
    const response = await api.patch(
      `/admin_panel_company/reject/${companyId}`,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to reject company.");
  }
};

// Create company profile
export const createCompany = async (payload, firebaseUid) => {
  try {
    const response = await api.post(
      "/admin_panel_company/create_new_company",
      payload,
      {
        params: {
          firebase_uid: firebaseUid,
        },
      },
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to create company.");
  }
};

// Create Firebase user for company onboarding
export const createCompanyFirebaseUser = async (phoneNumber, countryCode) => {
  try {
    const response = await api.post(
      "/admin_panel_company/create-company-firebase-user",
      {
        phone_number: phoneNumber,
        country_code: countryCode,
      },
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to create company Firebase user.");
  }
};

// Update company profile
export const updateCompany = async (companyId, payload) => {
  try {
    const response = await api.patch(
      `/admin_panel_company/${companyId}`,
      payload,
    );
    return extractApiData(response) || {};
  } catch (error) {
    throw safeApiError(error, "Failed to update company.");
  }
};

// Industry list (supports multiple backend route variants)
export const getIndustries = async () => {
  const endpoints = [
    // "/industry_types",
    "/industry_skill/industry_types",
    // "/industry/industry_types",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const data = extractApiData(response);
      if (Array.isArray(data)) return data;
    } catch {
      // continue to next fallback endpoint
    }
  }

  return [];
};
