using Microsoft.AspNetCore.Mvc;
using MahjongTournamentManager.Server.Data;
using MahjongTournamentManager.Server.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Collections.Generic;
using MahjongTournamentManager.Server.Models;

namespace MahjongTournamentManager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SplatoonTournamentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public SplatoonTournamentsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<SplatoonTournament>> PostSplatoonTournament(SplatoonTournamentCreationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var splatoonTournament = new SplatoonTournament
            {
                TournamentName = request.TournamentName,
                EventDate = request.EventDate,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                GameMode = request.GameMode,
                Comment = request.Comment,
                Status = request.Status,
                MaxParticipants = request.MaxParticipants,
                IsPrivate = request.IsPrivate
            };

            if (request.IsPrivate && request.InvitedUsers != null)
            {
                foreach (var userId in request.InvitedUsers)
                {
                    splatoonTournament.InvitedUsers.Add(new SplatoonTournamentInvitedUser { UserId = userId });
                }
            }

            _context.SplatoonTournaments.Add(splatoonTournament);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSplatoonTournament), new { id = splatoonTournament.Id }, splatoonTournament);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SplatoonTournamentDto>> GetSplatoonTournament(int id)
        {
            var tournament = await _context.SplatoonTournaments
                .Include(t => t.InvitedUsers)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tournament == null)
            {
                return NotFound();
            }

            var tournamentDto = new SplatoonTournamentDto
            {
                Id = tournament.Id,
                TournamentName = tournament.TournamentName,
                EventDate = tournament.EventDate.ToString("yyyy-MM-dd"),
                StartTime = tournament.StartTime.ToString("HH:mm"),
                EndTime = tournament.EndTime.ToString("HH:mm"),
                GameMode = tournament.GameMode,
                Comment = tournament.Comment,
                Status = tournament.Status,
                MaxParticipants = tournament.MaxParticipants,
                IsPrivate = tournament.IsPrivate,
                InvitedUserIds = tournament.InvitedUsers.Select(u => u.UserId).ToList()
            };

            return tournamentDto;
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSplatoonTournament(int id)
        {
            var tournament = await _context.SplatoonTournaments.FindAsync(id);
            if (tournament == null)
            {
                return NotFound();
            }

            _context.SplatoonTournaments.Remove(tournament);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/join")]
        [Authorize]
        public async Task<IActionResult> JoinTournament(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var tournament = await _context.SplatoonTournaments.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            var participantCount = await _context.SplatoonParticipants
                .CountAsync(p => p.SplatoonTournamentId == id);

            if (tournament.MaxParticipants.HasValue && participantCount >= tournament.MaxParticipants.Value)
            {
                return BadRequest("This tournament is full.");
            }

            var alreadyJoined = await _context.SplatoonParticipants
                .AnyAsync(p => p.SplatoonTournamentId == id && p.UserId == userId);
            if (alreadyJoined)
            {
                return BadRequest("Already joined this tournament.");
            }

            var participant = new SplatoonParticipant
            {
                SplatoonTournamentId = id,
                UserId = userId,
                JoinedDate = System.DateTime.UtcNow
            };

            _context.SplatoonParticipants.Add(participant);
            await _context.SaveChangesAsync();

            // Check if the tournament is now full and update status
            var newParticipantCount = participantCount + 1;
            if (tournament.MaxParticipants.HasValue && newParticipantCount >= tournament.MaxParticipants.Value)
            {
                tournament.Status = 2; // 募集終了
                await _context.SaveChangesAsync();
            }

            return Ok("Joined tournament successfully.");
        }

        [HttpGet("{id}/participants")]
        [Authorize]
        public async Task<ActionResult<SplatoonTournamentParticipantsResponse>> GetParticipants(int id)
        {
            var tournament = await _context.SplatoonTournaments.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            var participants = await _context.SplatoonParticipants
                .Where(p => p.SplatoonTournamentId == id)
                .Include(p => p.User)
                .ToListAsync();

            var response = new SplatoonTournamentParticipantsResponse
            {
                TournamentName = tournament.TournamentName,
                Participants = participants
            };

            return response;
        }

        [HttpGet("{id}/is-participating")]
        [Authorize]
        public async Task<ActionResult<bool>> IsUserParticipating(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return false;
            }

            return await _context.SplatoonParticipants
                .AnyAsync(p => p.SplatoonTournamentId == id && p.UserId == userId);
        }

        [HttpDelete("{tournamentId}/participants/{participantUserId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveParticipant(int tournamentId, string participantUserId)
        {
            var participant = await _context.SplatoonParticipants
                .FirstOrDefaultAsync(p => p.SplatoonTournamentId == tournamentId && p.UserId == participantUserId);

            if (participant == null)
            {
                return NotFound("Participant not found in this tournament.");
            }

            _context.SplatoonParticipants.Remove(participant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutSplatoonTournament(int id, SplatoonTournamentDto splatoonTournamentDto)
        {
            if (id != splatoonTournamentDto.Id)
            {
                return BadRequest();
            }

            var existingTournament = await _context.SplatoonTournaments
                .Include(t => t.InvitedUsers)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (existingTournament == null)
            {
                return NotFound();
            }

            existingTournament.TournamentName = splatoonTournamentDto.TournamentName;
            existingTournament.EventDate = DateOnly.Parse(splatoonTournamentDto.EventDate);
            existingTournament.StartTime = TimeOnly.Parse(splatoonTournamentDto.StartTime);
            existingTournament.EndTime = TimeOnly.Parse(splatoonTournamentDto.EndTime);
            existingTournament.GameMode = splatoonTournamentDto.GameMode;
            existingTournament.Comment = splatoonTournamentDto.Comment;
            existingTournament.Status = splatoonTournamentDto.Status;
            existingTournament.MaxParticipants = splatoonTournamentDto.MaxParticipants;
            existingTournament.IsPrivate = splatoonTournamentDto.IsPrivate;

            existingTournament.InvitedUsers.Clear();
            if (splatoonTournamentDto.IsPrivate && splatoonTournamentDto.InvitedUserIds != null)
            {
                foreach (var userId in splatoonTournamentDto.InvitedUserIds)
                {
                    existingTournament.InvitedUsers.Add(new SplatoonTournamentInvitedUser { UserId = userId });
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.SplatoonTournaments.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }
    }
}