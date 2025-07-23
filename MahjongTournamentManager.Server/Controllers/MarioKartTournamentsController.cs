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

namespace MahjongTournamentManager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarioKartTournamentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public MarioKartTournamentsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<MarioKartTournament>> PostMarioKartTournament(MarioKartTournamentCreationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var marioKartTournament = new MarioKartTournament
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
                    marioKartTournament.InvitedUsers.Add(new MarioKartTournamentInvitedUser { UserId = userId });
                }
            }

            _context.MarioKartTournaments.Add(marioKartTournament);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMarioKartTournament), new { id = marioKartTournament.Id }, marioKartTournament);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MarioKartTournamentDto>> GetMarioKartTournament(int id)
        {
            var tournament = await _context.MarioKartTournaments
                .Include(t => t.InvitedUsers)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tournament == null)
            {
                return NotFound();
            }

            var tournamentDto = new MarioKartTournamentDto
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
        public async Task<IActionResult> DeleteMarioKartTournament(int id)
        {
            var tournament = await _context.MarioKartTournaments.FindAsync(id);
            if (tournament == null)
            {
                return NotFound();
            }

            _context.MarioKartTournaments.Remove(tournament);
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

            var tournament = await _context.MarioKartTournaments.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            var participantCount = await _context.MarioKartParticipants
                .CountAsync(p => p.MarioKartTournamentId == id);

            if (tournament.MaxParticipants.HasValue && participantCount >= tournament.MaxParticipants.Value)
            {
                return BadRequest("This tournament is full.");
            }

            var alreadyJoined = await _context.MarioKartParticipants
                .AnyAsync(p => p.MarioKartTournamentId == id && p.UserId == userId);
            if (alreadyJoined)
            {
                return BadRequest("Already joined this tournament.");
            }

            var participant = new MarioKartParticipant
            {
                MarioKartTournamentId = id,
                UserId = userId
            };

            _context.MarioKartParticipants.Add(participant);
            await _context.SaveChangesAsync();

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
        public async Task<ActionResult<MarioKartTournamentParticipantsResponse>> GetParticipants(int id)
        {
            var tournament = await _context.MarioKartTournaments.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            var participants = await _context.MarioKartParticipants
                .Where(p => p.MarioKartTournamentId == id)
                .Include(p => p.User)
                .ToListAsync();

            var response = new MarioKartTournamentParticipantsResponse
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

            return await _context.MarioKartParticipants
                .AnyAsync(p => p.MarioKartTournamentId == id && p.UserId == userId);
        }

        [HttpDelete("{tournamentId}/participants/{participantUserId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveParticipant(int tournamentId, string participantUserId)
        {
            var participant = await _context.MarioKartParticipants
                .FirstOrDefaultAsync(p => p.MarioKartTournamentId == tournamentId && p.UserId == participantUserId);

            if (participant == null)
            {
                return NotFound("Participant not found in this tournament.");
            }

            _context.MarioKartParticipants.Remove(participant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutMarioKartTournament(int id, MarioKartTournamentDto marioKartTournamentDto)
        {
            if (id != marioKartTournamentDto.Id)
            {
                return BadRequest();
            }

            var existingTournament = await _context.MarioKartTournaments
                .Include(t => t.InvitedUsers)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (existingTournament == null)
            {
                return NotFound();
            }

            existingTournament.TournamentName = marioKartTournamentDto.TournamentName;
            existingTournament.EventDate = DateOnly.Parse(marioKartTournamentDto.EventDate);
            existingTournament.StartTime = TimeOnly.Parse(marioKartTournamentDto.StartTime);
            existingTournament.EndTime = TimeOnly.Parse(marioKartTournamentDto.EndTime);
            existingTournament.GameMode = marioKartTournamentDto.GameMode;
            existingTournament.Comment = marioKartTournamentDto.Comment;
            existingTournament.Status = marioKartTournamentDto.Status;
            existingTournament.MaxParticipants = marioKartTournamentDto.MaxParticipants;
            existingTournament.IsPrivate = marioKartTournamentDto.IsPrivate;

            existingTournament.InvitedUsers.Clear();
            if (marioKartTournamentDto.IsPrivate && marioKartTournamentDto.InvitedUserIds != null)
            {
                foreach (var userId in marioKartTournamentDto.InvitedUserIds)
                {
                    existingTournament.InvitedUsers.Add(new MarioKartTournamentInvitedUser { UserId = userId });
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.MarioKartTournaments.Any(e => e.Id == id))
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