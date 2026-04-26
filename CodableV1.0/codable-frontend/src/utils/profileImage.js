export const PROFILE_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const PROFILE_IMAGE_ALLOWED_EXTENSIONS_LABEL = "JPG, PNG, WEBP";

export const getProfileImageValidationMessage = () => {
  return `${PROFILE_IMAGE_ALLOWED_EXTENSIONS_LABEL} only.`;
};

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read selected image."));
    reader.readAsDataURL(file);
  });

export const validateProfileImageFile = async (file) => {
  if (!file) {
    return { valid: false, message: "Please select an image file." };
  }

  if (!PROFILE_IMAGE_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Invalid file type. Allowed formats: ${PROFILE_IMAGE_ALLOWED_EXTENSIONS_LABEL}.`
    };
  }

  return { valid: true, message: "" };
};

export const fileToDataUrl = (file) => toDataUrl(file);

export const extractProfileImage = (source) => {
  if (!source || typeof source !== "object") return "";

  return (
    source.avatar ||
    source.profilePicture ||
    source.profile_picture ||
    source.profileImage ||
    source.profile_image ||
    source.image ||
    source.photo ||
    ""
  );
};

export const extractProfileImageFromStudentProfileResponse = (profileResponse) => {
  const basic = profileResponse?.user_profile?.basic_info || {};
  return extractProfileImage(basic);
};

export const getInitialsFromName = (name = "") => {
  const trimmed = name.trim();
  if (!trimmed) return "U";

  return trimmed
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
