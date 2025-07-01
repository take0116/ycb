# 1. ビルド環境 (SDKイメージ)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 【変更点①】サーバープロジェクトのフォルダだけをコンテナにコピーする
COPY ["MahjongTournamentManager.Server/", "MahjongTournamentManager.Server/"]

# サーバープロジェクトのディレクトリに移動
WORKDIR /src/MahjongTournamentManager.Server

# 依存関係の復元
RUN dotnet restore "MahjongTournamentManager.Server.csproj"

# 発行(Publish)。buildはpublishコマンドに含まれるため、publishだけでOK
RUN dotnet publish "MahjongTournamentManager.Server.csproj" -c Release -o /app/publish

# 2. 実行環境 (ランタイムイメージ)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MahjongTournamentManager.Server.dll"]