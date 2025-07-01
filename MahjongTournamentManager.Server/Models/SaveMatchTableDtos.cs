using System.Collections.Generic;

namespace MahjongTournamentManager.Server.Models
{
    public class SaveMatchTableRequestDto
    {
        public List<GroupedMatchTableDto> GroupedMatchTables { get; set; }
    }

    public class GroupedMatchTableDto
    {
        public string TableName { get; set; }
        public List<object> Data { get; set; } // Can be string[] for header or MatchRowDataDto for data
    }

    public class MatchRowDataDto
    {
        public int MatchId { get; set; }
        public string Round { get; set; }
        public List<PlayerInfoDto> Players { get; set; }
        public List<string> DisplayCells { get; set; }
    }

    public class PlayerInfoDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }
}
