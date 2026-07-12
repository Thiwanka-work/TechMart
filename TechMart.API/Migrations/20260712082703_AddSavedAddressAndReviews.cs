using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechMart.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSavedAddressAndReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CustomerAddress",
                table: "Orders",
                newName: "CustomerPostalCode");

            migrationBuilder.AddColumn<string>(
                name: "SavedAddressLine1",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SavedAddressLine2",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SavedCity",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SavedFullName",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SavedPhone",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SavedPostalCode",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerAddressLine1",
                table: "Orders",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerAddressLine2",
                table: "Orders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerCity",
                table: "Orders",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Rating = table.Column<int>(type: "INTEGER", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ProductId_UserId",
                table: "Reviews",
                columns: new[] { "ProductId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropColumn(
                name: "SavedAddressLine1",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SavedAddressLine2",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SavedCity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SavedFullName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SavedPhone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SavedPostalCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CustomerAddressLine1",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CustomerAddressLine2",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CustomerCity",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "CustomerPostalCode",
                table: "Orders",
                newName: "CustomerAddress");
        }
    }
}
