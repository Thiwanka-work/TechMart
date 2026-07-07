using System;
using System.Linq;
using System.Threading.Tasks;
using TechMart.API.DTOs;
using TechMart.API.Helpers;
using TechMart.API.Models;
using TechMart.API.Repositories;

namespace TechMart.API.Services
{
    public class AuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly JWTHelper _jwtHelper;

        public AuthService(IRepository<User> userRepository, JWTHelper jwtHelper)
        {
            _userRepository = userRepository;
            _jwtHelper = jwtHelper;
        }

        public async Task<string?> RegisterAsync(RegisterDTO dto)
        {
            var users = await _userRepository.GetAllAsync();
            
            // Check for duplicate emails
            if (users.Any(u => u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase)))
            {
                return null;
            }

            // Mentoring Tip: Auto-promote the first registered user to Admin for local testing ease
            var role = users.Any() ? "Customer" : "Admin";

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email.Trim().ToLower(),
                PasswordHash = PasswordHasher.HashPassword(dto.Password),
                Role = role
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            return _jwtHelper.GenerateToken(user);
        }

        public async Task<string?> LoginAsync(LoginDTO dto)
        {
            var users = await _userRepository.GetAllAsync();
            var user = users.FirstOrDefault(u => u.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase));

            if (user == null || !PasswordHasher.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return null;
            }

            return _jwtHelper.GenerateToken(user);
        }
    }
}
