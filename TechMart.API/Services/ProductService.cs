using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Linq;
using System.Threading.Tasks;
using TechMart.API.Models;
using TechMart.API.DTOs;
using TechMart.API.Repositories;

namespace TechMart.API.Services
{
    public class ProductService
    {
        private readonly IRepository<Product> _productRepository;
        private readonly IRepository<Category> _categoryRepository;

        public ProductService(IRepository<Product> productRepository, IRepository<Category> categoryRepository)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<IEnumerable<Product>> GetProductsAsync()
        {
            return await _productRepository.GetAllAsync();
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            return await _productRepository.GetByIdAsync(id);
        }

        public async Task<Product> CreateProductAsync(ProductDTO dto)
        {
            // Ensure Category exists
            var categories = await _categoryRepository.GetAllAsync();
            if (!categories.Any(c => c.Name.Equals(dto.Category, StringComparison.OrdinalIgnoreCase)))
            {
                await _categoryRepository.AddAsync(new Category { Name = dto.Category });
                await _categoryRepository.SaveChangesAsync();
            }

            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                Stock = dto.Stock,
                Category = dto.Category,
                ImageUrl = dto.ImageUrl,
                AdditionalImagesJson = JsonSerializer.Serialize(dto.AdditionalImages ?? new List<string>()),
                VariantsJson = JsonSerializer.Serialize(dto.Variants ?? new List<string>()),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _productRepository.AddAsync(product);
            await _productRepository.SaveChangesAsync();
            return product;
        }

        public async Task<Product?> UpdateProductAsync(int id, ProductDTO dto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return null;

            // Ensure Category exists
            var categories = await _categoryRepository.GetAllAsync();
            if (!categories.Any(c => c.Name.Equals(dto.Category, StringComparison.OrdinalIgnoreCase)))
            {
                await _categoryRepository.AddAsync(new Category { Name = dto.Category });
                await _categoryRepository.SaveChangesAsync();
            }

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.Stock = dto.Stock;
            product.Category = dto.Category;
            
            // Only update image if a new URL is provided
            if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
            {
                product.ImageUrl = dto.ImageUrl;
            }
            
            product.AdditionalImagesJson = JsonSerializer.Serialize(dto.AdditionalImages ?? new List<string>());
            product.VariantsJson = JsonSerializer.Serialize(dto.Variants ?? new List<string>());
            
            product.UpdatedAt = DateTime.UtcNow;

            _productRepository.Update(product);
            await _productRepository.SaveChangesAsync();
            return product;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return false;

            _productRepository.Delete(product);
            return await _productRepository.SaveChangesAsync();
        }
    }
}
