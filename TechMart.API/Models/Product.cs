using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace TechMart.API.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string Category { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string AdditionalImagesJson { get; set; } = "[]";
        public string VariantsJson { get; set; } = "[]";
        
        [NotMapped]
        public List<string> AdditionalImages => JsonSerializer.Deserialize<List<string>>(string.IsNullOrWhiteSpace(AdditionalImagesJson) ? "[]" : AdditionalImagesJson) ?? new List<string>();

        [NotMapped]
        public List<string> Variants => JsonSerializer.Deserialize<List<string>>(string.IsNullOrWhiteSpace(VariantsJson) ? "[]" : VariantsJson) ?? new List<string>();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
