import { injected, useAccount, useConnect, useSwitchChain } from "wagmi";
import { Game } from "./Game";

function App() {
  const { isConnected, chain, address } = useAccount();
  const { connect } = useConnect();
  const { chains, switchChain } = useSwitchChain()
  const isOnSupportedChain = chains.some((c) => c.id === chain?.id);

  const SwitchChains = () => (
    <div style={{display: "flex", gap: "12px", justifyContent: "center", paddingTop: "3em"}}>
      {chains.map((c) => (
        <button className="button" key={c.id} onClick={() => switchChain({ chainId: c.id })}>
         Switch To Game Chain
        </button>
      ))}
    </div>
  )


  return (
    <>
      <div className="app">
        {isConnected ? (
          <>
          {isOnSupportedChain ? (
            <div className="container">
              <header className="header">
                <h1 className="title">Bots Attack</h1>
              </header>

              <div className="boards-container">
                <div className="board-section">
                  {address && <Game address={address} />}
                </div>
              </div>
            </div>
            ) : (
              <SwitchChains/>
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
