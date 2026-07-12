using System;

namespace TechMart.API.DTOs
{
    public class ReviewDTO
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class SubmitReviewRequest
    {
        public int ProductId { get; set; }
        public int Rating { get; set; } // 1 to 5
        public string Comment { get; set; } = string.Empty;
        public string? ReviewerName { get; set; }
    }
}
