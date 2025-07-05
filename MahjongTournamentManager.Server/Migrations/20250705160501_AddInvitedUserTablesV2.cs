using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MahjongTournamentManager.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitedUserTablesV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tournaments");

            migrationBuilder.DropColumn(
                name: "InvitedUserIds",
                table: "TournamentSettings");

            migrationBuilder.DropColumn(
                name: "InvitedUserIds",
                table: "SplatoonTournaments");

            migrationBuilder.CreateTable(
                name: "SplatoonTournamentInvitedUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SplatoonTournamentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SplatoonTournamentInvitedUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SplatoonTournamentInvitedUsers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SplatoonTournamentInvitedUsers_SplatoonTournaments_Splatoon~",
                        column: x => x.SplatoonTournamentId,
                        principalTable: "SplatoonTournaments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TournamentInvitedUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TournamentSettingsId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TournamentInvitedUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TournamentInvitedUsers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TournamentInvitedUsers_TournamentSettings_TournamentSetting~",
                        column: x => x.TournamentSettingsId,
                        principalTable: "TournamentSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SplatoonTournamentInvitedUsers_SplatoonTournamentId",
                table: "SplatoonTournamentInvitedUsers",
                column: "SplatoonTournamentId");

            migrationBuilder.CreateIndex(
                name: "IX_SplatoonTournamentInvitedUsers_UserId",
                table: "SplatoonTournamentInvitedUsers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentInvitedUsers_TournamentSettingsId",
                table: "TournamentInvitedUsers",
                column: "TournamentSettingsId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentInvitedUsers_UserId",
                table: "TournamentInvitedUsers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SplatoonTournamentInvitedUsers");

            migrationBuilder.DropTable(
                name: "TournamentInvitedUsers");

            migrationBuilder.AddColumn<string>(
                name: "InvitedUserIds",
                table: "TournamentSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvitedUserIds",
                table: "SplatoonTournaments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Tournaments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InvitedUserIds = table.Column<string>(type: "text", nullable: true),
                    IsPrivate = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tournaments", x => x.Id);
                });
        }
    }
}
