using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using TechMart.API.DTOs;
using TechMart.API.Models;
using TechMart.API.Repositories;

namespace TechMart.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IRepository<User> _userRepository;

        public UserController(IRepository<User> userRepository)
        {
            _userRepository = userRepository;
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

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var profile = new UserProfileDTO
            {
                SavedFullName = user.SavedFullName ?? string.Empty,
                SavedPhone = user.SavedPhone ?? string.Empty,
                SavedAddressLine1 = user.SavedAddressLine1 ?? string.Empty,
                SavedAddressLine2 = user.SavedAddressLine2,
                SavedCity = user.SavedCity ?? string.Empty,
                SavedPostalCode = user.SavedPostalCode ?? string.Empty
            };

            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserProfileDTO dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Profile data is required." });
            }

            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            user.SavedFullName = dto.SavedFullName;
            user.SavedPhone = dto.SavedPhone;
            user.SavedAddressLine1 = dto.SavedAddressLine1;
            user.SavedAddressLine2 = dto.SavedAddressLine2;
            user.SavedCity = dto.SavedCity;
            user.SavedPostalCode = dto.SavedPostalCode;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully." });
        }
    }
}
