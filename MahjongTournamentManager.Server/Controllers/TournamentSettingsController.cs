using MahjongTournamentManager.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MahjongTournamentManager.Server.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System;

namespace MahjongTournamentManager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public TournamentSettingsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/TournamentSettings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TournamentListItem>>> GetTournaments()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var mahjongQuery = _context.TournamentSettings.AsQueryable();
            var splatoonQuery = _context.SplatoonTournaments.AsQueryable();

            if (!isAdmin)
            {
                mahjongQuery  = mahjongQuery.Where(t =>  (!t.IsPrivate || t.InvitedUsers.Any(u => u.UserId == userId)) && (int)t.Status != (int)TournamentStatus.Finished);
                splatoonQuery = splatoonQuery.Where(t => (!t.IsPrivate || t.InvitedUsers.Any(u => u.UserId == userId)) && (int)t.Status != (int)TournamentStatus.Finished);
            }

            var mahjongTournaments = await mahjongQuery
                .Select(t => new TournamentListItem
                {
                    Id = t.Id,
                    GameTitle = "雀魂",
                    TournamentName = t.TournamentName,
                    StartDate = t.StartDate,
                    Status = (int)t.Status,
                    Description = t.Description,
                    DetailUrl = $"/events/{t.Id}"
                })
                .ToListAsync();

            var splatoonTournaments = await splatoonQuery
                .Select(t => new TournamentListItem
                {
                    Id = t.Id,
                    GameTitle = "スプラトゥーン",
                    TournamentName = t.TournamentName,
                    StartDate = DateOnly.FromDateTime(t.EventDate.ToDateTime(t.StartTime)),
                    Status = t.Status,
                    Description = t.Comment,
                    DetailUrl = $"/splatoon-event/{t.Id}"
                })
                .ToListAsync();

            var allTournaments = mahjongTournaments
                .Concat(splatoonTournaments)
                .OrderBy(t => t.StartDate)
                .ToList();

            return allTournaments;
        }

        // GET: api/TournamentSettings/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TournamentSettings>> GetTournamentSettings(int id)
        {
            var tournamentSettings = await _context.TournamentSettings
                .Include(t => t.InvitedUsers)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tournamentSettings == null)
            {
                return NotFound();
            }

            return tournamentSettings;
        }

        // GET: api/TournamentSettings/{id}/matches
        [HttpGet("{id}/matches")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<MatchDto>>> GetMatches(int id)
        {
            var matches = await _context.MahjongMatches
                .Where(m => m.TournamentSettingsId == id)
                .Include(m => m.MahjongMatchPlayers)
                    .ThenInclude(mp => mp.User)
                .OrderBy(m => m.Round)
                .ToListAsync();

            if (matches == null || !matches.Any())
            {
                return NotFound("No matches found for this tournament.");
            }

            var matchDtos = matches.Select(m => new MatchDto
            {
                Id = m.Id,
                Round = m.Round,
                ByePlayerUserNames = m.ByePlayerUserNames,
                SchedulingStartDate = m.SchedulingStartDate,
                MahjongMatchPlayers = m.MahjongMatchPlayers.Select(mp => new MatchPlayerDto
                {
                    TableNumber = mp.TableNumber,
                    User = new UserDto { Id = mp.User.Id, UserName = mp.User.UserName },
                    Score = mp.Score
                }).ToList()
            }).ToList();

            return matchDtos;
        }

        // GET: api/TournamentSettings/{id}/participants
        [HttpGet("{id}/participants")]
        [Authorize]
        public async Task<ActionResult<TournamentParticipantsResponse>> GetParticipants(int id)
        {
            var tournament = await _context.TournamentSettings.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            var participants = await _context.TournamentParticipants
                .Where(tp => tp.TournamentSettingsId == id)
                .Include(tp => tp.User)
                .ToListAsync();

            var response = new TournamentParticipantsResponse
            {
                TournamentName = tournament.TournamentName,
                Participants = participants,
                PlayerCount = tournament.PlayerCount
            };

            return response;
        }

        // GET: api/TournamentSettings/{id}/is-participating
        [HttpGet("{id}/is-participating")]
        [Authorize]
        public async Task<ActionResult<bool>> IsUserParticipating(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return false;
            }

            var isParticipating = await _context.TournamentParticipants
                .AnyAsync(tp => tp.TournamentSettingsId == id && tp.UserId == userId);

            return isParticipating;
        }

        // POST: api/TournamentSettings/{id}/join
        [HttpPost("{id}/join")]
        [Authorize]
        public async Task<IActionResult> JoinTournament(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var tournament = await _context.TournamentSettings.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            if (tournament.Status != TournamentStatus.Recruiting)
            {
                return BadRequest("This tournament is not recruiting participants.");
            }

            var alreadyJoined = await _context.TournamentParticipants
                .AnyAsync(tp => tp.TournamentSettingsId == id && tp.UserId == userId);
            if (alreadyJoined)
            {
                return BadRequest("Already joined this tournament.");
            }

            var participant = new TournamentParticipant
            {
                TournamentSettingsId = id,
                UserId = userId,
                JoinedDate = System.DateTime.UtcNow
            };

            _context.TournamentParticipants.Add(participant);
            await _context.SaveChangesAsync();

            return Ok("Joined tournament successfully.");
        }

        // DELETE: api/TournamentSettings/{tournamentId}/participants/{participantUserId}
        [HttpDelete("{tournamentId}/participants/{participantUserId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveParticipant(int tournamentId, string participantUserId)
        {
            var participant = await _context.TournamentParticipants
                .FirstOrDefaultAsync(tp => tp.TournamentSettingsId == tournamentId && tp.UserId == participantUserId);

            if (participant == null)
            {
                return NotFound("Participant not found in this tournament.");
            }

            _context.TournamentParticipants.Remove(participant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/TournamentSettings/{id}/save-match-table
        [HttpPost("{id}/save-match-table")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SaveMatchTable(int id, [FromBody] SaveMatchTableRequestDto request)
        {
            var tournament = await _context.TournamentSettings.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            if (tournament.IsTableLocked)
            {
                return BadRequest("Match table is already locked.");
            }

            var existingMatches = _context.MahjongMatches.Where(m => m.TournamentSettingsId == id);
            if (existingMatches.Any())
            {
                _context.MahjongMatches.RemoveRange(existingMatches);
                await _context.SaveChangesAsync(); // Clear old matches first
            }

            var allUsers = await _context.Users.ToListAsync();
            var userNameToIdMap = allUsers.ToDictionary(u => u.UserName, u => u.Id);

            foreach (var tableGroup in request.GroupedMatchTables)
            {
                int tableNumber = tableGroup.TableName[0] - 'A' + 1;

                // Data[0] is header, so skip it. The rest are objects.
                foreach (var rowObject in tableGroup.Data.Skip(1))
                {
                    // Deserialize the object from the dynamic request
                    var rowJson = System.Text.Json.JsonSerializer.Serialize(rowObject);
                    var options = new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var rowData = System.Text.Json.JsonSerializer.Deserialize<MatchRowDataDto>(rowJson, options);

                    if (rowData == null || rowData.Round == null) continue;

                    var match = new MahjongMatch
                    {
                        TournamentSettingsId = id,
                        Round = int.Parse(rowData.Round),
                        ByePlayerUserNames = rowData.DisplayCells.ElementAtOrDefault(2) ?? "-",
                        MahjongMatchPlayers = new List<MahjongMatchPlayer>()
                    };

                    foreach (var player in rowData.Players)
                    {
                        if (userNameToIdMap.ContainsKey(player.Name))
                        {
                            match.MahjongMatchPlayers.Add(new MahjongMatchPlayer
                            {
                                UserId = player.Id,
                                TableNumber = tableNumber
                            });
                        }
                    }
                    _context.MahjongMatches.Add(match);
                }
            }

            tournament.IsTableLocked = true;
            tournament.Status = TournamentStatus.RecruitmentClosed;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Match table saved and locked successfully." });
        }

        // POST: api/TournamentSettings/{id}/unlock-match-table
        [HttpPost("{id}/unlock-match-table")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnlockMatchTable(int id)
        {
            var tournament = await _context.TournamentSettings.FindAsync(id);
            if (tournament == null)
            {
                return NotFound("Tournament not found.");
            }

            // Find and delete all matches associated with the tournament
            var matches = _context.MahjongMatches.Where(m => m.TournamentSettingsId == id);
            if (matches.Any())
            {
                _context.MahjongMatches.RemoveRange(matches);
            }

            // Unlock the table and set status back to recruiting
            tournament.IsTableLocked = false;
            tournament.Status = TournamentStatus.Recruiting; // Set back to Recruiting

            await _context.SaveChangesAsync();

            return Ok(new { message = "Match table unlocked and tournament is now recruiting." });
        }

        // POST: api/TournamentSettings
        [HttpPost]
        public async Task<ActionResult<TournamentSettings>> PostTournamentSettings(MahjongTournamentCreationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tournamentSettings = new TournamentSettings
            {
                TournamentName = request.TournamentName,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                PlayerCount = request.PlayerCount,
                GameType = request.GameType,
                ThinkTime = request.ThinkTime,
                AllowFlying = request.AllowFlying,
                RedDora = request.RedDora,
                StartingScore = request.StartingScore,
                Description = request.Description,
                Status = (TournamentStatus)request.Status,
                IsPrivate = request.IsPrivate
            };

            if (request.IsPrivate && request.InvitedUsers != null)
            {
                foreach (var userId in request.InvitedUsers)
                {
                    tournamentSettings.InvitedUsers.Add(new TournamentInvitedUser { UserId = userId });
                }
            }

            _context.TournamentSettings.Add(tournamentSettings);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTournamentSettings), new { id = tournamentSettings.Id }, tournamentSettings);
        }

        // PUT: api/TournamentSettings/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutTournamentSettings(int id, TournamentSettingsUpdateDto tournamentSettingsDto)
        {
            if (id != tournamentSettingsDto.Id)
            {
                return BadRequest();
            }

            var existingTournament = await _context.TournamentSettings
                .Include(t => t.InvitedUsers)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (existingTournament == null)
            {
                return NotFound();
            }

            existingTournament.TournamentName = tournamentSettingsDto.TournamentName;
            existingTournament.StartDate = tournamentSettingsDto.StartDate;
            existingTournament.EndDate = tournamentSettingsDto.EndDate;
            existingTournament.PlayerCount = tournamentSettingsDto.PlayerCount;
            existingTournament.GameType = tournamentSettingsDto.GameType;
            existingTournament.ThinkTime = tournamentSettingsDto.ThinkTime;
            existingTournament.AllowFlying = tournamentSettingsDto.AllowFlying;
            existingTournament.RedDora = tournamentSettingsDto.RedDora;
            existingTournament.StartingScore = tournamentSettingsDto.StartingScore;
            existingTournament.Description = tournamentSettingsDto.Description;
            existingTournament.Status = tournamentSettingsDto.Status;
            existingTournament.IsPrivate = tournamentSettingsDto.IsPrivate;

            existingTournament.InvitedUsers.Clear();
            if (tournamentSettingsDto.IsPrivate && tournamentSettingsDto.InvitedUsers != null)
            {
                foreach (var invitedUser in tournamentSettingsDto.InvitedUsers)
                {
                    existingTournament.InvitedUsers.Add(new TournamentInvitedUser { UserId = invitedUser.UserId });
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TournamentSettingsExists(id))
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

        // DELETE: api/TournamentSettings/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTournamentSettings(int id)
        {
            var tournamentSettings = await _context.TournamentSettings.FindAsync(id);
            if (tournamentSettings == null)
            {
                return NotFound();
            }

            _context.TournamentSettings.Remove(tournamentSettings);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/TournamentSettings/matches/{matchId}/schedule-start
        [HttpPut("matches/{matchId}/schedule-start")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSchedulingStartDate(int matchId, [FromBody] DateOnly? newDate)
        {
            var match = await _context.MahjongMatches.FindAsync(matchId);
            if (match == null)
            {
                return NotFound("Match not found.");
            }

            // Delete existing availabilities for this match
            var existingAvailabilities = _context.ScheduleAvailabilities
                .Where(sa => sa.MahjongMatchId == matchId);
            if (existingAvailabilities.Any())
            {
                _context.ScheduleAvailabilities.RemoveRange(existingAvailabilities);
            }

            match.SchedulingStartDate = newDate;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Scheduling start date updated successfully and existing availabilities cleared." });
        }

        // GET: api/TournamentSettings/{matchId}/availabilities
        [HttpGet("{matchId}/availabilities")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ScheduleAvailability>>> GetAvailabilities(int matchId)
        {
            return await _context.ScheduleAvailabilities
                .Where(sa => sa.MahjongMatchId == matchId)
                .ToListAsync();
        }

        // POST: api/TournamentSettings/{matchId}/availabilities/batch
        [HttpPost("{matchId}/availabilities/batch")]
        [Authorize]
        public async Task<IActionResult> BatchUpdateAvailabilities(int matchId, [FromBody] BatchAvailabilityRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            // Remove all existing availabilities for the user for this match
            var existingAvailabilities = _context.ScheduleAvailabilities
                .Where(sa => sa.MahjongMatchId == matchId && sa.UserId == userId);
            _context.ScheduleAvailabilities.RemoveRange(existingAvailabilities);

            // Add new availabilities
            foreach (var timeStr in request.Times)
            {
                if (TimeOnly.TryParse(timeStr, out var time))
                {
                    _context.ScheduleAvailabilities.Add(new ScheduleAvailability
                    {
                        MahjongMatchId = matchId,
                        UserId = userId,
                        Time = time
                    });
                }
            }

            foreach (var dateTimeStr in request.DateTimes)
            {
                if (System.DateTime.TryParse(dateTimeStr, out var dateTime))
                {
                    _context.ScheduleAvailabilities.Add(new ScheduleAvailability
                    {
                        MahjongMatchId = matchId,
                        UserId = userId,
                        DateTime = dateTime.ToUniversalTime()
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok();
        }


        private bool TournamentSettingsExists(int id)
        {
            return _context.TournamentSettings.Any(e => e.Id == id);
        }

        [HttpPut("{id}/teams")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTeams(int id, [FromBody] List<TeamUpdateRequest> request)
        {
            var participants = await _context.TournamentParticipants
                                            .Where(p => p.TournamentSettingsId == id)
                                            .ToListAsync();

            foreach (var update in request)
            {
                var participant = participants.FirstOrDefault(p => p.UserId == update.UserId);
                if (participant != null)
                {
                    participant.Team = update.Team;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Teams updated successfully." });
        }

        [HttpPost("matches/save-result")]
        [Authorize]
        public async Task<IActionResult> SaveResult([FromBody] SaveResultDto request)
        {
            var match = await _context.MahjongMatches
                                    .Include(m => m.MahjongMatchPlayers)
                                    .FirstOrDefaultAsync(m => m.Id == request.MatchId);

            if (match == null)
            {
                return NotFound("Match not found.");
            }

            // Optional: Check if the current user is part of the match or is an admin
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            var isPlayerInMatch = match.MahjongMatchPlayers.Any(p => p.UserId == currentUserId);

            if (!isAdmin && !isPlayerInMatch)
            {
                return Forbid();
            }

            foreach (var playerScore in request.PlayerScores)
            {
                var playerInMatch = match.MahjongMatchPlayers
                                        .FirstOrDefault(p => p.UserId == playerScore.UserId);
                if (playerInMatch != null)
                {
                    playerInMatch.Score = playerScore.Score;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Result saved successfully." });
        }
    }

    public class BatchAvailabilityRequest
    {
        public List<string> Times { get; set; }
        public List<string> DateTimes { get; set; }
    }

    public class TeamUpdateRequest
    {
        public string UserId { get; set; }
        public string? Team { get; set; }
    }
}
