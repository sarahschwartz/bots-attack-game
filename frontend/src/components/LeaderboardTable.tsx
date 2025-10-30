import { useReadContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";

export function LeaderboardTable({ address }: { address: `0x${string}` }) {
  const { data: playerWins } = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "playerWins",
    args: [address],
  });

  const { data: topScores } = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTopScores",
  });

  const topScoresIsArray = Array.isArray(topScores);

  const playerInTop =
    topScoresIsArray && topScores.some((score) => score.player === address);
  const allScores = playerInTop
    ? topScores.map((score) =>
        score.player === address ? { ...score, player: "You" } : score
      )
    : topScoresIsArray
    ? [...topScores, { player: "You", totalWins: playerWins }]
    : [];

  return (
    <>
      {!topScoresIsArray || topScores.length === 0 ? (
        <div className="flex w-full justify-center">
          No players on leaderboard yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/20 bg-white/5 max-w-[620px] m-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm text-white/90">
              <thead>
                <tr className="text-white/80">
                  <th className="px-5 py-3 text-left font-semibold">
                    <div>Player Address</div>
                    <div className="mt-2 h-0.5 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">
                    <div># of Wins</div>
                    <div className="mt-2 ml-auto h-0.5 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                  </th>
                </tr>
              </thead>

              <tbody className="[&>tr:last-child>td]:border-b-0">
                {allScores.map(({ player, totalWins }) => (
                  <tr
                    key={player}
                    className="border-b border-white/10 transition-colors hover:bg-white/10"
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-white">{player}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">
                      {totalWins?.toString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
