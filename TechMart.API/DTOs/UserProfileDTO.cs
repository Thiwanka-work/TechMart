namespace TechMart.API.DTOs
{
    public class UserProfileDTO
    {
        public string SavedFullName { get; set; } = string.Empty;
        public string SavedPhone { get; set; } = string.Empty;
        public string SavedAddressLine1 { get; set; } = string.Empty;
        public string? SavedAddressLine2 { get; set; }
        public string SavedCity { get; set; } = string.Empty;
        public string SavedPostalCode { get; set; } = string.Empty;
    }
}
