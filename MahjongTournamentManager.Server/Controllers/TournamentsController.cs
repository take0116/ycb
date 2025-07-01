using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using MahjongTournamentManager.Server.Models;

namespace MahjongTournamentManager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentsController : ControllerBase
    {
        private static readonly List<Tournament> _tournaments = new List<Tournament>
        {
            new Tournament { Id = 1, Name = "第1回 Gemini杯", StartDate = new DateTime(2024, 7, 1) },
            new Tournament { Id = 2, Name = "Mリーグ 2024-25", StartDate = new DateTime(2024, 10, 1) },
            new Tournament { Id = 3, Name = "全国麻雀学生選手権", StartDate = new DateTime(2024, 8, 15), EndDate = new DateTime(2024, 8, 17) }
        };

        [HttpGet]
        public ActionResult<IEnumerable<Tournament>> GetTournaments()
        {
            return Ok(_tournaments);
        }

        [HttpGet("{id}")]
        public ActionResult<Tournament> GetTournament(int id)
        {
            var tournament = _tournaments.FirstOrDefault(t => t.Id == id);
            if (tournament == null)
            {
                return NotFound();
            }
            return Ok(tournament);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTournament(int id, Tournament tournament)
        {
            if (id != tournament.Id)
            {
                return BadRequest();
            }

            var existingTournament = _tournaments.FirstOrDefault(t => t.Id == id);
            if (existingTournament == null)
            {
                return NotFound();
            }

            existingTournament.Name = tournament.Name;
            existingTournament.StartDate = tournament.StartDate;
            existingTournament.EndDate = tournament.EndDate;

            return NoContent();
        }

        [HttpPost]
        public ActionResult<Tournament> CreateTournament(Tournament tournament)
        {
            tournament.Id = _tournaments.Any() ? _tournaments.Max(t => t.Id) + 1 : 1;
            _tournaments.Add(tournament);
            return CreatedAtAction(nameof(GetTournament), new { id = tournament.Id }, tournament);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteTournament(int id)
        {
            var tournament = _tournaments.FirstOrDefault(t => t.Id == id);
            if (tournament == null)
            {
                return NotFound();
            }

            _tournaments.Remove(tournament);
            return NoContent();
        }

        [HttpPost("{id}/entry")]
        public IActionResult EnterTournament(int id, [FromBody] TournamentEntryRequest request)
        {
            var tournament = _tournaments.FirstOrDefault(t => t.Id == id);
            if (tournament == null)
            {
                return NotFound();
            }

            // ここでエントリー処理を行います。例: データベースに保存
            Console.WriteLine($"Tournament ID: {id}, Comment: {request.Comment}");

            return Ok();
        }
    }
}

public class TournamentEntryRequest
{
    public string? Comment { get; set; }
}
