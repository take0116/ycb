using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MahjongTournamentManager.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateScheduleAvailabilityForFlexibleScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvailableDateTime",
                table: "ScheduleAvailabilities");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateTime",
                table: "ScheduleAvailabilities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "Time",
                table: "ScheduleAvailabilities",
                type: "time without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateTime",
                table: "ScheduleAvailabilities");

            migrationBuilder.DropColumn(
                name: "Time",
                table: "ScheduleAvailabilities");

            migrationBuilder.AddColumn<DateTime>(
                name: "AvailableDateTime",
                table: "ScheduleAvailabilities",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
