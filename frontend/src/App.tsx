import { injected, useAccount, useConnect, useSwitchChain } from "wagmi";
import { Game } from "./Game";
import { useState } from "react";
import { LeaderboardTable } from "./components/LeaderboardTable";

function App() {
  const [showComponent, setShowComponent] = useState<"game" | "leaderboard">(
    "game"
  );
  const { isConnected, chain, address } = useAccount();
  const { connect } = useConnect();
  const { chains, switchChain } = useSwitchChain();
  const isOnSupportedChain = chains.some((c) => c.id === chain?.id);

  const SwitchChains = () => (
    <div
      style={{
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        paddingTop: "3em",
      }}
    >
      {chains.map((c) => (
        <button
          className="button"
          key={c.id}
          onClick={() => switchChain({ chainId: c.id })}
        >
          Switch To Game Chain
        </button>
      ))}
    </div>
  );

  const Header = () => (
    <header className="header">
      <h1 className="title">Bots Attack</h1>
    </header>
  );

  return (
    <>
      <div className="app">
        {isConnected && address ? (
          <>
            {isOnSupportedChain ? (
              <div className="container">
                <div>
                  {showComponent === "game" ? (
                    <>
                      <div className="m-4">
                        <button
                          className="button"
                          onClick={() => setShowComponent("leaderboard")}
                        >
                          Leaderboard
                        </button>
                      </div>
                      <Header />
                      <div className="boards-container">
                        <div className="board-section">
                          {address && <Game address={address} />}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="m-4">
                        <button
                          className="button"
                          onClick={() => setShowComponent("game")}
                        >
                          Play
                        </button>
                      </div>
                      <Header />
                      <LeaderboardTable address={address} />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <SwitchChains />
            )}
          </>
        ) : (
          <div className="connect-container">
            <button
              className="button"
              onClick={() => connect({ connector: injected() })}
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
