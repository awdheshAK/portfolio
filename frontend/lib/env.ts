export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getRazorpayKey(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY || "";
}

export function getCloudinaryCloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
}
