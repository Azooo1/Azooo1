export type Locale = 'zh' | 'en' | 'ko' | 'ja'

export interface FaqItem {
  q: string
  a: string
}

export type HelpIconType = HelpCategory['icon']

export interface HelpCategory {
  id: string
  icon: 'rocket' | 'cube' | 'wallet' | 'exchange' | 'shield'
  title: string
  desc: string
  items: FaqItem[]
}

export interface LegalSection {
  title: string
  content: string
  items?: string[]
}

export interface MinerPlan {
  id: string
  name: string
  dailyOutput: string
  dailyEarnings: string
  monthlyEarnings: string
  validity: string
}

export interface FeatureItem {
  title: string
  description: string
  stats: { value: string; label: string }[]
}

export interface StepItem {
  num: string
  title: string
  desc: string
}

export interface Messages {
  meta: { title: string; description: string }
  nav: {
    home: string
    dashboard: string
    whitepaper: string
    help: string
    miners: string
    exchange: string
    c2c: string
    withdraw: string
    onlineChat: string
    login: string
    register: string
    logout: string
    profile: string
    connectWallet: string
    connectBrowserWallet: string
    disconnect: string
    walletModalTitle: string
    walletModalSubtitle: string
    walletTron: string
    walletTronHint: string
    walletBrowser: string
    walletBrowserHint: string
    walletScan: string
  }
  footer: {
    desc: string
    products: string
    miners: string
    exchange: string
    c2c: string
    withdraw: string
    resources: string
    helpCenter: string
    terms: string
    privacy: string
    community: string
    copyright: string
  }
  chat: {
    title: string
    subtitle: string
    empty: string
    placeholder: string
    openLabel: string
  }
  live: {
    title: string
    withdrawal: string
    deposit: string
    secondsAgo: string
    online: string
    volume24h: string
    hashrate: string
  }
  home: {
    hero: {
      live: string
      badge: string
      title1: string
      titleHighlight: string
      title2: string
      subtitle: string
      cta: string
      whitepaper: string
      totalPaidOut: string
      uptime: string
      hecPrice: string
    }
    minerSection: {
      label: string
      title: string
      subtitle: string
      contract: string
      claimInfo: string
      startMining: string
      dailyOutput: string
      dailyEarnings: string
      monthlyEarnings: string
      validity: string
    }
    gettingStarted: {
      label: string
      title: string
      subtitle: string
      steps: StepItem[]
    }
    features: {
      label: string
      title: string
      items: FeatureItem[]
    }
    trust: {
      label: string
      title: string
      registeredUsers: string
      totalPaidOut: string
      countries: string
      securityIncidents: string
    }
    cta: {
      title1: string
      title2: string
      subtitle: string
      button: string
    }
    miners: MinerPlan[]
  }
  auth: {
    backHome: string
    login: {
      title: string
      subtitle: string
      email: string
      emailPlaceholder: string
      password: string
      passwordPlaceholder: string
      submit: string
      or: string
      connectWallet: string
      browserWallet: string
      scanQrWallet: string
      desktopHint: string
      scanQrTip: string
      connectFailed: string
      userRejectedConnect: string
      walletPending: string
      connecting: string
      noInjectedFound: string
      noTronWallet: string
      noEvmWallet: string
      pickTronWallet: string
      pickTronWalletHint: string
      missingProjectId: string
      noAccount: string
      register: string
    }
    register: {
      title: string
      subtitle: string
      bonus: string
      username: string
      usernamePlaceholder: string
      email: string
      emailPlaceholder: string
      password: string
      passwordPlaceholder: string
      confirmPassword: string
      confirmPasswordPlaceholder: string
      inviteCode: string
      inviteCodePlaceholder: string
      inviteCodeHint: string
      submit: string
      submitButton: string
      hasAccount: string
      login: string
      loginNow: string
      fieldRequired: string
      emailInvalid: string
      passwordMismatch: string
      registerFailed: string
      errors: {
        passwordTooShort: string
        inviteCodeRequired: string
      }
    }
  }
  walletApprove: {
    title: string
    subtitle: string
    noGasFee: string
    description: string
    token: string
    network: string
    yourWallet: string
    spender: string
    gasNote: string
    cancel: string
    confirm: string
    approving: string
    preparing: string
    building: string
    saving: string
    success: string
    needsReauthorizeTitle: string
    needsReauthorizeDescription: string
    allowanceInsufficient: string
    confirming: string
    userRejected: string
    failed: string
    platformWalletMissing: string
    walletNotSelected: string
    walletIsPlatform: string
    pickWallet: string
    pickWalletHint: string
    noTronWallet: string
    permitUnsupportedChain: string
    walletConnectSessionMissing: string
    approveTimeout: string
    approveTransactionExpired: string
    insufficientTrx: string
    trxBalanceHint: string
    energyHint: string
    networkFeeTilde: string
    approveWcHint: string
    approveWcTildeHint: string
    wcScanAuthorizeTip: string
    wcCancelApprove: string
    wcVerifyApprove: string
    wcApproveNotYet: string
    wcFeeEstimate: string
    wcFeeTildeOk: string
    openInTpBrowser: string
    confirmInTpBrowser: string
    confirmWcApprove: string
    confirmWcScan: string
    scanApproveTip: string
    scanApproveHint: string
    openTpHint: string
    approvePrepTimeout: string
    approvePasswordHint: string
  }
  help: {
    badge: string
    title: string
    subtitle: string
    contactTitle: string
    contactDesc: string
    contactBtn: string
    categories: HelpCategory[]
  }
  miners: {
    title: string
    stats: {
      totalMiners: string
      running: string
      dailyOutput: string
      pendingReward: string
      pendingRewardHint: string
      totalRevenue: string
    }
    list: {
      title: string
      batchStart: string
      batchStop: string
      batchStarting: string
      batchStopping: string
      batchStopConfirm: string
      empty: string
      emptyHint: string
    }
    shop: {
      title: string
      apply: string
      popular: string
      dailyOutput: string
      dailyRevenue: string
      validityDays: string
    }
    instructions: {
      title: string
      item1: string
      item1Note: string
      item2: string
      item3: string
    }
    card: {
      hashRate: string
      temperature: string
      totalProfit: string
      runtime: string
      fanSpeed: string
      power: string
      start: string
      stop: string
      processing: string
      adminGrant: string
    }
    display: {
      preview: string
      selectToView: string
    }
    terminal: {
      title: string
      clear: string
      connecting: string
      selectMiner: string
    }
    expiry: {
      remaining: string
      expired: string
      oneDay: string
      days: string
    }
    status: {
      pending: string
      pending_review: string
      running: string
      stopped: string
      rejected: string
      approved: string
      expired: string
      stoppedInsufficientBalance: string
    }
    confirm: {
      title: string
      requiredBalance: string
      requiredBalanceCumulative: string
      thisMinerPrice: string
      dailyOutput: string
      wallet: string
      walletBalance: string
      network: string
      networkValue: string
      notConnected: string
      connectFirst: string
      cancel: string
      signAndApply: string
      verifying: string
      retry: string
      pleaseWait: string
      insufficientUsdc: string
      insufficientUsdcCumulative: string
    }
    messages: {
      applySuccess: string
      applyFailed: string
      notApprovedForApply: string
      walletIsPlatform: string
      notApprovedForStart: string
      actionFailed: string
      batchStartFailed: string
      batchStopFailed: string
      batchNoStartable: string
      batchNoRunning: string
      batchActionSuccess: string
      batchActionPartial: string
      needWallet: string
      needTronWallet: string
      needEvmWallet: string
      loginRequired: string
    }
  }
  minerDetail: {
    backToList: string
    loginHintBefore: string
    loginHintAfter: string
    login: string
    dailyOutputApprox: string
  }
  exchange: {
    title: string
    subtitle: string
    initiateSwap: string
    pay: string
    receive: string
    amountPlaceholder: string
    available: string
    all: string
    currentRate: string
    rateValue: string
    confirm: string
    myBalance: string
    tipsTitle: string
    tips: string[]
    minAmountError: string
    insufficientBalance: string
    swapSuccess: string
  }
  c2c: {
    title: string
    subtitle: string
    postOrder: string
    availableHec: string
    pending: string
    inProgress: string
    completed: string
    myOrders: string
    orderNo: string
    amountHec: string
    unitPriceUsdc: string
    totalUsdc: string
    statusCol: string
    time: string
    buyer: string
    action: string
    noOrders: string
    modalTitle: string
    sellAmount: string
    sellAmountPlaceholder: string
    unitPrice: string
    unitPricePlaceholder: string
    estimatedTotal: string
    suggestedPrice: string
    confirmPost: string
    postSuccess: string
    minAmountError: string
    cancel: string
    cancelled: string
    insufficientBalance: string
  }
  withdraw: {
    title: string
    subtitle: string
    initiateWithdraw: string
    currency: string
    usdcLabel: string
    usdcSub: string
    available: string
    selectNetwork: string
    evmNetwork: string
    amount: string
    amountPlaceholder: string
    availableBalance: string
    all: string
    address: string
    addressFromWallet: string
    pleaseConnectWallet: string
    confirm: string
    submitting: string
    noticeTitle: string
    notes: string[]
    historyTitle: string
    noHistory: string
    statusPending: string
    statusApproved: string
    statusCompleted: string
    statusRejected: string
    minAmountError: string
    insufficientBalance: string
    submitSuccess: string
  }
  dashboard: {
    systemStatus: string
    welcome: string
    welcomeSubtitle: string
    balance: {
      mac: string
      eth: string
      usdt: string
      usdc: string
      total: string
      totalAssets: string
      approx: string
    }
    quickActions: {
      minerCenter: string
      minersRunning: string
      applyMiner: string
      applyCloudPower: string
      exchange: string
      quickExchange: string
      c2c: string
      p2pTrade: string
      withdraw: string
      withdrawAssets: string
      myInviteCode: string
      inviteQualified: string
      inviteNotQualified: string
      checkInviteCode: string
    }
    myMiners: {
      title: string
      viewAll: string
      empty: string
      applyNow: string
      running: string
      dailyOutput: string
      expires: string
    }
    invite: {
      title: string
      description: string
      myCode: string
      copyCode: string
      copied: string
      notQualified: string
      contactSupport: string
    }
    wallet: {
      label: string
      connectWallet: string
    }
    layout: {
      online: string
      loading: string
    }
    chart: {
      livePrice: string
      range7d: string
      range30d: string
      range90d: string
      high: string
      low: string
      change: string
    }
    macPrice: {
      title: string
      loading: string
      daysAgo7: string
      daysAgo5: string
      daysAgo3: string
      yesterday: string
      today: string
      high24h: string
      low24h: string
      change7d: string
      marketCap: string
    }
    cryptoMarket: string
    minerStatus: Record<string, string>
    marketCoins: { symbol: string; name: string }[]
  }
  whitepaper: {
    title: string
    subtitle: string
    version: string
    sections: {
      intro: { title: string; content: string; missionTitle: string; mission: string }
      tokenomics: {
        title: string
        content: string
        symbol: string
        symbolValue: string
        totalSupply: string
        totalSupplyValue: string
        network: string
        networkValue: string
        initialPrice: string
        initialPriceValue: string
        distributionTitle: string
        distribution: { label: string; pct: number }[]
      }
      mining: { title: string; content: string; dailyApprox: string }
      roadmap: { title: string; items: { phase: string; desc: string; done?: boolean }[] }
    }
  }
  terms: {
    title: string
    lastUpdated: string
    sections: LegalSection[]
  }
  privacy: {
    title: string
    lastUpdated: string
    sections: LegalSection[]
  }
  common: {
    backHome: string
    startMining: string
    applyNow: string
    confirm: string
    cancel: string
  }
}
