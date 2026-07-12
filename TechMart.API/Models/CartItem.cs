namespace TechMart.API.Models
{
    public class CartItem
    {
        public int Id { get; set; }
        public int CartId { get; set; }
        public int ProductId { get; set; }
        public string Variant { get; set; } = string.Empty;
        public int Quantity { get; set; }

        // Navigation properties
        public Cart? Cart { get; set; }
        public Product? Product { get; set; }
    }
}
