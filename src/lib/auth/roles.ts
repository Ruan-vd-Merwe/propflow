export function resolveRoleFlags(metadata: Record<string, unknown>): {
  isLandlord: boolean;
  isTenant: boolean;
  isConnector: boolean;
} {
  return {
    isLandlord: !!(metadata.is_landlord ?? metadata.user_type === "landlord"),
    isTenant: !!(metadata.is_tenant ?? metadata.user_type === "tenant"),
    isConnector: !!(metadata.is_connector ?? metadata.user_type === "connector"),
  };
}

export function getPostAuthPath(
  isLandlord: boolean,
  isTenant: boolean,
  isConnector?: boolean,
): string {
  if (isTenant && !isLandlord) return "/tenant/profile";
  if (isLandlord) return "/dashboard";
  if (isConnector) return "/dashboard";
  return "/onboarding";
}
