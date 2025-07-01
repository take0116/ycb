# 1. ビルド環境 (SDKイメージ)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 【改善点①】
# プロジェクトファイル(*.csproj)だけを先にコピーする
# .slnファイルがある場合はそれも先にコピーすると更に良い
COPY ["MahjongTournamentManager.Server/MahjongTournamentManager.Server.csproj", "MahjongTournamentManager.Server/"]

# 【改善点②】
# ソースコードをコピーする前に、依存関係の復元を済ませる
# これにより、.csprojに変更がない限り、このステップはキャッシュが使われ、高速になる
RUN dotnet restore "MahjongTournamentManager.Server/MahjongTournamentManager.Server.csproj"

# ここでソースコード全体をコピーする
COPY . .
WORKDIR "/src/MahjongTournamentManager.Server"
RUN dotnet build "MahjongTournamentManager.Server.csproj" -c Release -o /app/build

# 2. 発行(Publish)ステージ
FROM build AS publish
RUN dotnet publish "MahjongTournamentManager.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 3. 実行環境 (ランタイムイメージ)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MahjongTournamentManager.Server.dll"]