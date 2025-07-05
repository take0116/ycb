using System;
using System.ComponentModel.DataAnnotations;

namespace MahjongTournamentManager.Server.Models
{
    public enum TournamentStatus
    {
        Planning, // 企画中
        Recruiting, // 募集中
        RecruitmentClosed, // 募集終了
        Finished // 終了
    }

    public class TournamentSettings
    {
        public int Id { get; set; } // Primary key

        [Required]
        public string TournamentName { get; set; }

        // 開催日程
        [Required]
        public DateOnly StartDate { get; set; }
        [Required]
        public DateOnly EndDate { get; set; }

        // 雀魂友人戦設定
        [Required]
        public int PlayerCount { get; set; } // 3 or 4
        [Required]
        public string GameType { get; set; } // "東風戦" or "半荘戦"
        [Required]
        public string ThinkTime { get; set; } // "5+10秒", "5+20秒", "60秒", "300秒"
        public bool AllowFlying { get; set; } // 飛び (true/false)
        public bool RedDora { get; set; } // 赤ドラ (true/false)
        public int StartingScore { get; set; } // 配給原点 (e.g., 25000, 30000)
        public string? Description { get; set; } // コメント
        public TournamentStatus Status { get; set; } // 大会状態
        public bool IsTableLocked { get; set; } = false; // 対戦表がロックされているか
        public bool IsPrivate { get; set; }
        public virtual ICollection<TournamentInvitedUser> InvitedUsers { get; set; } = new List<TournamentInvitedUser>();
    }
}
