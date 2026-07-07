using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TechMart.API.Data;
using TechMart.API.DTOs;
using TechMart.API.Models;

namespace TechMart.API.Services
{
    public class OrderService
    {
        private readonly ApplicationDbContext _context;

        public OrderService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<OrderDTO?> PlaceOrderAsync(int? userId, PlaceOrderRequest request)
        {
            // Mentoring Tip: Use DbTransactions for multi-entity modifications to prevent incomplete orders
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (request.Items == null || !request.Items.Any())
                {
                    return null;
                }

                decimal totalAmount = 0;
                var orderItems = new List<OrderItem>();

                foreach (var item in request.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null) continue;

                    // Validate stock level
                    if (product.Stock < item.Quantity)
                    {
                        throw new InvalidOperationException($"Insufficient stock for product '{product.Name}'. Available: {product.Stock}");
                    }

                    // Deduct stock
                    product.Stock -= item.Quantity;
                    _context.Products.Update(product);

                    // Accumulate totals (snapshot the checkout price!)
                    totalAmount += product.Price * item.Quantity;

                    orderItems.Add(new OrderItem
                    {
                        ProductId = product.Id,
                        Quantity = item.Quantity,
                        Price = product.Price
                    });
                }

                var order = new Order
                {
                    UserId = userId,
                    CustomerName = request.CustomerName,
                    CustomerEmail = request.CustomerEmail,
                    CustomerPhone = request.CustomerPhone,
                    CustomerAddress = request.CustomerAddress,
                    PaymentMethod = request.PaymentMethod,
                    TotalAmount = totalAmount,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    OrderItems = orderItems
                };

                await _context.Orders.AddAsync(order);

                // Clear customer's shopping cart in DB if registered
                if (userId.HasValue)
                {
                    var cart = await _context.Carts
                        .Include(c => c.CartItems)
                        .FirstOrDefaultAsync(c => c.UserId == userId.Value);
                    if (cart != null && cart.CartItems.Any())
                    {
                        _context.CartItems.RemoveRange(cart.CartItems);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToDTO(order);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<OrderDTO>> GetUserOrdersAsync(int userId)
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(MapToDTO);
        }

        public async Task<IEnumerable<OrderDTO>> GetAllOrdersAsync()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(MapToDTO);
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, string status)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) return false;

            order.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }

        private static OrderDTO MapToDTO(Order order)
        {
            return new OrderDTO
            {
                Id = order.Id,
                UserId = order.UserId,
                CustomerName = string.IsNullOrWhiteSpace(order.CustomerName) 
                    ? (order.User != null ? order.User.FullName : "Unknown Customer")
                    : order.CustomerName,
                CustomerEmail = string.IsNullOrWhiteSpace(order.CustomerEmail) 
                    ? (order.User != null ? order.User.Email : "Unknown Email")
                    : order.CustomerEmail,
                CustomerPhone = order.CustomerPhone,
                CustomerAddress = order.CustomerAddress,
                PaymentMethod = order.PaymentMethod,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                OrderItems = order.OrderItems.Select(oi => new OrderItemDTO
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? "Unknown Product",
                    Quantity = oi.Quantity,
                    Price = oi.Price
                }).ToList()
            };
        }
    }
}
