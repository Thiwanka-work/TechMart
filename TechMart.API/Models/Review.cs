using System;

namespace TechMart.API.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int? UserId { get; set; }
        public string? AnonymousReviewerName { get; set; }
        public int Rating { get; set; } // 1 to 5 stars
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Product? Product { get; set; }
        public User? User { get; set; }
    }
}
