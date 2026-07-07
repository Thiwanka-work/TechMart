using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using TechMart.API.Models;
using TechMart.API.Services;
using Microsoft.Extensions.Configuration;

namespace TechMart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ProductService _productService;
        private readonly string _apiKey;
        private readonly IHttpClientFactory _httpClientFactory;

        public ChatController(ProductService productService, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _productService = productService;
            _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message is required." });
            }

            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return Ok(new { 
                    response = "System Message: Gemini API Key is not configured yet in appsettings.json. In the meantime, I am MartBuddy, your AI shopping assistant! Please add a valid Gemini ApiKey under the 'Gemini' section to enable full conversational intelligence." 
                });
            }

            try
            {
                // 1. Fetch live product inventory context
                var products = await _productService.GetProductsAsync();
                
                // 2. Build structured database context string
                var inventoryBuilder = new StringBuilder();
                inventoryBuilder.AppendLine("LIVE INVENTORY CONTEXT (Available stock, categories, prices):");
                foreach (var p in products)
                {
                    inventoryBuilder.AppendLine($"- Name: {p.Name}");
                    inventoryBuilder.AppendLine($"  Category: {p.Category}");
                    inventoryBuilder.AppendLine($"  Price: Rs. {p.Price:N2} LKR");
                    inventoryBuilder.AppendLine($"  Stock Level: {p.Stock} units in stock");
                    inventoryBuilder.AppendLine($"  Specifications: {p.Description}");
                    inventoryBuilder.AppendLine();
                }

                // 3. Build system instruction prompt with rules matching the user's specification
                var systemInstruction = $@"You are 'MartBuddy', an expert AI Shopping Assistant and Tech Consultant for an online gadget store. Your goal is to help users find the absolute best device (Phones, Laptops, Smartwatches, Earbuds) based on their budget, needs, and preferences.

Strict Rules for your behavior:
1. ONLY RECOMMEND PRODUCTS FROM THE PROVIDED [Live Inventory Context]. Do not invent products or recommend models that are not explicitly listed in the context.
2. IF NO PRODUCTS MATCH: Politely inform the user that we currently don't have that exact match in stock, and suggest the closest alternative from the provided context.
3. DEVICE COMPARISON: When asked to compare devices (e.g., 'Compare X vs Y'), use the structured technical specifications provided. Break down the pros and cons clearly (e.g., 'X has a better display, but Y has faster charging'). 
4. PRICING: Always state the prices in LKR (Sri Lankan Rupees) as provided in the database. Never negotiate or change the price.
5. TONE: Be helpful, tech-savvy, polite, and professional. Keep your answers concise and scannable using bullet points for technical specs.
6. If the user greets you (e.g., 'Hi', 'Hello'), greet them back warmly as MartBuddy and ask how you can help them find their next tech device.
7. LANGUAGE SUPPORT: You must respond in the same language the user queried you in. If the user greets or queries you in Sinhala (සිංහල) or Singlish (Sinhala written in English letters), you must respond in clear, grammatically correct, and natural Sinhala (සිංහල) language.

[Live Inventory Context]
{inventoryBuilder.ToString()}";

                // 4. Send request to Gemini API (using gemini-2.5-flash)
                var client = _httpClientFactory.CreateClient();
                var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            role = "user",
                            parts = new[]
                            {
                                new { text = request.Message }
                            }
                        }
                    },
                    systemInstruction = new
                    {
                        parts = new[]
                        {
                            new { text = systemInstruction }
                        }
                    }
                };

                var jsonPayload = JsonSerializer.Serialize(payload);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var response = await client.PostAsync(endpoint, content);
                if (!response.IsSuccessStatusCode)
                {
                    var errorDetails = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, new { message = "Gemini API call failed.", details = errorDetails });
                }

                var responseJsonString = await response.Content.ReadAsStringAsync();
                
                // Parse the Gemini Response structure: candidates[0].content.parts[0].text
                using var doc = JsonDocument.Parse(responseJsonString);
                var root = doc.RootElement;
                
                var botResponseText = root
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return Ok(new { response = botResponseText });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred inside the chat assistant handler.", error = ex.Message });
            }
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}