using System;

namespace TechMart.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer"; // Customer or Admin
        public string? SavedFullName { get; set; }
        public string? SavedPhone { get; set; }
        public string? SavedAddressLine1 { get; set; }
        public string? SavedAddressLine2 { get; set; }
        public string? SavedCity { get; set; }
        public string? SavedPostalCode { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
