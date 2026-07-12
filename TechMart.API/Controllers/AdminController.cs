using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TechMart.API.Data;
using TechMart.API.DTOs;
using TechMart.API.Models;
using TechMart.API.Services;

namespace TechMart.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ProductService _productService;
        private readonly OrderService _orderService;
        private readonly ApplicationDbContext _context;

        public AdminController(ProductService productService, OrderService orderService, ApplicationDbContext context)
        {
            _productService = productService;
            _orderService = orderService;
            _context = context;
        }

        [HttpPost("products")]
        public async Task<IActionResult> AddProduct([FromBody] ProductDTO productDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = await _productService.CreateProductAsync(productDto);
            return CreatedAtAction(nameof(ProductsController.GetById), "Products", new { id = product.Id }, product);
        }

        [HttpPut("products/{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductDTO productDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = await _productService.UpdateProductAsync(id, productDto);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            return Ok(product);
        }

        [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var success = await _productService.DeleteProductAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Product not found." });
            }

            return Ok(new { message = "Product deleted successfully." });
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderService.GetAllOrdersAsync();
            return Ok(orders);
        }

        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var success = await _orderService.UpdateOrderStatusAsync(id, request.Status);
            if (!success)
            {
                return NotFound(new { message = "Order not found." });
            }

            return Ok(new { message = "Order status updated successfully." });
        }

        // Mentoring Tip: Local file upload handler for development
        [HttpPost("products/upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No image file provided." });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Create a unique filename to prevent overwriting existing uploads
            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var request = HttpContext.Request;
            var publicUrl = $"{request.Scheme}://{request.Host}/uploads/{fileName}";

            return Ok(new { imageUrl = publicUrl });
        }

        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalProducts = await _context.Products.CountAsync();
            var totalCategories = await _context.Categories.CountAsync();
            var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");
            var totalOrders = await _context.Orders.CountAsync();
            var totalRevenue = (await _context.Orders
                .Where(o => o.Status != "Cancelled")
                .Select(o => o.TotalAmount)
                .ToListAsync())
                .Sum();
            var lowStockProducts = await _context.Products.CountAsync(p => p.Stock <= 5);

            var recentOrders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .Select(o => new {
                    Id = o.Id,
                    CustomerName = string.IsNullOrWhiteSpace(o.CustomerName) 
                        ? (o.User != null ? o.User.FullName : "Unknown Customer")
                        : o.CustomerName,
                    CustomerEmail = string.IsNullOrWhiteSpace(o.CustomerEmail) 
                        ? (o.User != null ? o.User.Email : "")
                        : o.CustomerEmail,
                    CustomerPhone = o.CustomerPhone,
                    CustomerAddress = o.CustomerAddressLine1 + (string.IsNullOrWhiteSpace(o.CustomerAddressLine2) ? "" : ", " + o.CustomerAddressLine2) + ", " + o.CustomerCity + " " + o.CustomerPostalCode,
                    PaymentMethod = o.PaymentMethod,
                    CreatedAt = o.CreatedAt,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    OrderItems = o.OrderItems.Select(oi => new {
                        ProductId = oi.ProductId,
                        ProductName = oi.Product != null ? oi.Product.Name : "Unknown Product",
                        Quantity = oi.Quantity,
                        Price = oi.Price
                    }).ToList()
                })
                .ToListAsync();

            return Ok(new
            {
                TotalProducts = totalProducts,
                TotalCategories = totalCategories,
                TotalCustomers = totalCustomers,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                LowStockProducts = lowStockProducts,
                RecentOrders = recentOrders
            });
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories.ToListAsync();
            var products = await _context.Products.ToListAsync();

            var result = categories.Select(c => new
            {
                Id = c.Id,
                Name = c.Name,
                ImageUrl = c.ImageUrl,
                ProductCount = products.Count(p => p.Category.Equals(c.Name, StringComparison.OrdinalIgnoreCase))
            }).ToList();

            return Ok(result);
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] Category model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest(new { message = "Category name is required." });
            }

            if (await _context.Categories.AnyAsync(c => c.Name.ToLower() == model.Name.ToLower()))
            {
                return BadRequest(new { message = "Category already exists." });
            }

            await _context.Categories.AddAsync(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest(new { message = "Category name is required." });
            }

            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Category not found." });
            }

            var oldName = category.Name;
            category.Name = model.Name;
            category.ImageUrl = model.ImageUrl;

            // Update all products with the old category name to the new one (case-insensitive check)
            var products = await _context.Products.Where(p => p.Category.ToLower() == oldName.ToLower()).ToListAsync();
            foreach (var product in products)
            {
                product.Category = model.Name;
                _context.Products.Update(product);
            }

            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Category not found." });
            }

            var categoryName = category.Name;

            // set all products in this category to "Uncategorized" (case-insensitive check)
            var products = await _context.Products.Where(p => p.Category.ToLower() == categoryName.ToLower()).ToListAsync();
            foreach (var product in products)
            {
                product.Category = "Uncategorized";
                _context.Products.Update(product);
            }

            // Ensure "Uncategorized" category exists in categories table as well
            if (!await _context.Categories.AnyAsync(c => c.Name.ToLower() == "uncategorized"))
            {
                await _context.Categories.AddAsync(new Category { Name = "Uncategorized" });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Category deleted successfully." });
        }

        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomers()
        {
            var customers = await _context.Users.Where(u => u.Role == "Customer").ToListAsync();
            var orders = await _context.Orders.ToListAsync();

            var result = customers.Select(c => new
            {
                Id = c.Id,
                FullName = c.FullName,
                Email = c.Email,
                CreatedAt = c.CreatedAt,
                TotalOrders = orders.Count(o => o.UserId == c.Id),
                TotalSpent = orders.Where(o => o.UserId == c.Id && o.Status != "Cancelled").Sum(o => o.TotalAmount)
            }).ToList();

            return Ok(result);
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settingsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "settings.json");
            if (!System.IO.File.Exists(settingsPath))
            {
                var defaultSettings = new StoreSettings();
                return Ok(defaultSettings);
            }

            var json = await System.IO.File.ReadAllTextAsync(settingsPath);
            return Content(json, "application/json");
        }

        [HttpPost("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] StoreSettings model)
        {
            var settingsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "settings.json");
            var json = System.Text.Json.JsonSerializer.Serialize(model, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            await System.IO.File.WriteAllTextAsync(settingsPath, json);
            return Ok(model);
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class StoreSettings
    {
        public string StoreName { get; set; } = "TechMart";
        public string ContactEmail { get; set; } = "support@techmart.com";
        public string PhoneNumber { get; set; } = "+1 (555) 019-2834";
        public string Address { get; set; } = "123 Tech Boulevard, Silicon Valley, CA";
        public string LogoUrl { get; set; } = "";
    }
}
