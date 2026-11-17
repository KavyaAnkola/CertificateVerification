const ABI = [
  "function addCertificate(string,string,string,string,string,string)",
  "function owner() view returns (address)",
  "function verifyCertificate(string,string) view returns (bool)",
  "function getCertificate(string) view returns (string,string,string,string,string,string)"
];

let provider;
let signer;
let contract;
let isOwner = false;
const $ = (id) => document.getElementById(id);
const setStatus = (message, isError = false) => { $("status").textContent = message; $("status").style.color = isError ? "#ff9eac" : "#92a6d8"; };
function getAddress() { const address = $("contractAddress").value.trim(); if (!ethers.isAddress(address)) throw new Error("Enter a valid deployed contract address."); return address; }
async function connect() {
  if (!window.ethereum) throw new Error("MetaMask is not installed in this browser.");
  await window.ethereum.request({ method: "eth_requestAccounts" }); provider = new ethers.BrowserProvider(window.ethereum); signer = await provider.getSigner(); contract = new ethers.Contract(getAddress(), ABI, signer);
  const network = await provider.getNetwork(); const ownerAddress = await contract.owner(); isOwner = signer.address.toLowerCase() === ownerAddress.toLowerCase();
  $("walletLabel").textContent = `${signer.address.slice(0, 6)}...${signer.address.slice(-4)}`;
  $("roleLabel").textContent = isOwner ? "Owner access: issue and verify certificates" : "Verifier access: verify certificates";
  $("loginPanel").classList.add("hidden"); $("appShell").classList.remove("hidden"); $("connectButton").textContent = "Connected";
  if (isOwner) { $("modeButtons").classList.remove("hidden"); showPanel("add"); } else { $("modeButtons").classList.add("hidden"); showPanel("verify"); }
  setStatus(`Connected · Chain ID ${network.chainId}`);
}
async function ensureContract() { if (!contract) await connect(); return contract; }
function showPanel(mode) { $("addPanel").classList.toggle("hidden", mode !== "add"); $("verifyPanel").classList.toggle("hidden", mode !== "verify"); }
function clearUserData() {
  ["certificateId", "studentName", "registrationNumber", "course", "issueDate", "certificateHash", "verifyId", "verifyHash"].forEach((id) => { $(id).value = ""; });
  $("verificationBadge").textContent = "Waiting";
  $("verificationBadge").className = "badge neutral";
  $("certificateDetails").innerHTML = "";
  $("certificateDetails").classList.add("hidden");
}
$("contractAddress").value = localStorage.getItem("certificateContractAddress") || "";
$("saveAddressButton").addEventListener("click", () => { try { const address = getAddress(); localStorage.setItem("certificateContractAddress", address); setStatus("Contract address saved. Connect MetaMask to continue."); } catch (error) { setStatus(error.message, true); } });
$("connectButton").addEventListener("click", async () => { try { await connect(); } catch (error) { setStatus(error.message, true); } });
$("showAddButton").addEventListener("click", () => showPanel("add"));
$("showVerifyButton").addEventListener("click", () => showPanel("verify"));
$("disconnectButton").addEventListener("click", () => { contract = undefined; signer = undefined; provider = undefined; isOwner = false; clearUserData(); $("connectButton").textContent = "Connect MetaMask"; $("appShell").classList.add("hidden"); $("loginPanel").classList.remove("hidden"); $("status").textContent = "Logged out"; });
if (window.ethereum) window.ethereum.on("accountsChanged", () => { contract = undefined; signer = undefined; provider = undefined; isOwner = false; clearUserData(); $("connectButton").textContent = "Connect MetaMask"; $("appShell").classList.add("hidden"); $("loginPanel").classList.remove("hidden"); $("status").textContent = "Wallet changed. Connect again."; });
$("addCertificateForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try { const activeContract = await ensureContract(); setStatus("Waiting for MetaMask confirmation..."); const transaction = await activeContract.addCertificate($("certificateId").value.trim(), $("studentName").value.trim(), $("registrationNumber").value.trim(), $("course").value.trim(), $("issueDate").value.trim(), $("certificateHash").value.trim()); setStatus(`Transaction submitted: ${transaction.hash.slice(0, 12)}...`); await transaction.wait(); setStatus("Certificate added successfully."); $("verifyId").value = $("certificateId").value.trim(); } catch (error) { setStatus(error.shortMessage || error.message, true); }
});
$("verifyCertificateForm").addEventListener("submit", async (event) => {
  event.preventDefault(); const badge = $("verificationBadge"); const details = $("certificateDetails");
  try { const activeContract = await ensureContract(); const id = $("verifyId").value.trim(); const hash = $("verifyHash").value.trim(); const isValid = await activeContract.verifyCertificate(id, hash); badge.textContent = isValid ? "Valid certificate" : "Invalid certificate"; badge.className = `badge ${isValid ? "success" : "error"}`; if (isValid) { const [certificateId, studentName, registrationNumber, course, issueDate] = await activeContract.getCertificate(id); details.innerHTML = `<p><strong>ID:</strong> ${certificateId}</p><p><strong>Student:</strong> ${studentName}</p><p><strong>Registration:</strong> ${registrationNumber}</p><p><strong>Course:</strong> ${course}</p><p><strong>Issue date:</strong> ${issueDate}</p>`; details.classList.remove("hidden"); } else details.classList.add("hidden"); } catch (error) { setStatus(error.shortMessage || error.message, true); }
});
