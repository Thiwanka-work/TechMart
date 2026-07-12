using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TechMart.API.Data;
using TechMart.API.DTOs;
using TechMart.API.Models;

namespace TechMart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null)
            {
                throw new InvalidOperationException("User ID claim not found.");
            }
            return int.Parse(claim.Value);
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetProductReviews(int productId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDTO
                {
                    Id = r.Id,
                    ProductId = r.ProductId,
                    ReviewerName = r.UserId.HasValue 
                        ? (r.User != null ? r.User.FullName : "Registered User")
                        : (string.IsNullOrEmpty(r.AnonymousReviewerName) ? "Anonymous" : r.AnonymousReviewerName),
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }

        [HttpPost]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Review data is required." });
            }

            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { message = "Rating must be between 1 and 5 stars." });
            }

            // Verify if product exists
            var productExists = await _context.Products.AnyAsync(p => p.Id == request.ProductId);
            if (!productExists)
            {
                return NotFound(new { message = "Product not found." });
            }

            int? userId = null;
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim != null)
            {
                userId = int.Parse(claim.Value);
            }

            if (userId.HasValue)
            {
                // Check if logged-in user already left a review
                var existingReview = await _context.Reviews
                    .FirstOrDefaultAsync(r => r.ProductId == request.ProductId && r.UserId == userId);

                if (existingReview != null)
                {
                    // Update existing review
                    existingReview.Rating = request.Rating;
                    existingReview.Comment = request.Comment;
                    existingReview.CreatedAt = DateTime.UtcNow;

                    _context.Reviews.Update(existingReview);
                    await _context.SaveChangesAsync();

                    return Ok(new ReviewDTO
                    {
                        Id = existingReview.Id,
                        ProductId = existingReview.ProductId,
                        ReviewerName = User.FindFirst(ClaimTypes.Name)?.Value ?? "You",
                        Rating = existingReview.Rating,
                        Comment = existingReview.Comment,
                        CreatedAt = existingReview.CreatedAt
                    });
                }

                // Create new review for logged-in user
                var review = new Review
                {
                    ProductId = request.ProductId,
                    UserId = userId,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Reviews.AddAsync(review);
                await _context.SaveChangesAsync();

                var user = await _context.Users.FindAsync(userId);

                return Ok(new ReviewDTO
                {
                    Id = review.Id,
                    ProductId = review.ProductId,
                    ReviewerName = user?.FullName ?? "You",
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt
                });
            }
            else
            {
                // Create new guest review
                var review = new Review
                {
                    ProductId = request.ProductId,
                    UserId = null,
                    AnonymousReviewerName = string.IsNullOrWhiteSpace(request.ReviewerName) ? "Guest" : request.ReviewerName,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Reviews.AddAsync(review);
                await _context.SaveChangesAsync();

                return Ok(new ReviewDTO
                {
                    Id = review.Id,
                    ProductId = review.ProductId,
                    ReviewerName = review.AnonymousReviewerName,
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(new { message = "Review not found." });
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review deleted successfully." });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllReviewsAdmin()
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Product)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    Id = r.Id,
                    ProductId = r.ProductId,
                    ProductName = r.Product != null ? r.Product.Name : "Unknown Product",
                    ReviewerName = r.UserId.HasValue 
                        ? (r.User != null ? r.User.FullName : "Registered User")
                        : (string.IsNullOrEmpty(r.AnonymousReviewerName) ? "Anonymous" : r.AnonymousReviewerName),
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }
    }
}
