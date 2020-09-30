const express = require("express");
const {mxw,token} = require("mxw-sdk-js");
const {
  NonFungibleToken,
  NonFungibleTokenActions,
} = require("mxw-sdk-js/dist/non-fungible-token");
const {
  FungibleTokenActions,
} = require("mxw-sdk-js/dist/token");
const { hexlify, randomBytes, bigNumberify } = require("mxw-sdk-js/dist/utils");
const app = express();
const port = 8080;

//init
let connection = {
  url: "http://localhost:26657",
  timeout: 60000,
};
let providerConnection = new mxw.providers.JsonRpcProvider(connection, {
  chainId: "maxonrow-chain",
  name: "mxw",
});
const providerMnemonic =
  "language indoor mushroom gold motor genuine tower ripple baby journey where offer crumble chuckle velvet dizzy trigger owner mother screen panic question cliff dish";
let provider = mxw.Wallet.fromMnemonic(providerMnemonic).connect(
  providerConnection
);

const issuerMnemonic =
  "appear scale write grow tiger puppy trick kite exhibit distance target cliff coin silly because train matrix weather list chat stamp warfare hobby ocean";
let issuer =  mxw.Wallet.fromMnemonic(issuerMnemonic).connect(
  providerConnection
);

const middlewareMnemonic =
  "guard loop tell accuse village list prevent sea dolphin weapon own track spike venue gun blind carry hawk weapon track rain amazing author eagle";
let middleware =  mxw.Wallet.fromMnemonic(middlewareMnemonic).connect(
  providerConnection
);

const ftProviderMnemonic =
  "naive hire arctic injury camp twelve actor valid process voice return unusual glad hen ginger brisk clever solve toss expire type road blood green";
let ftProvider = mxw.Wallet.fromMnemonic(ftProviderMnemonic).connect(
  providerConnection
);

const ftIssuerMnemonic =
  "wreck fiber slice novel nurse guess plate oven cotton life thought tape addict thank frown ready rival walk dish short solution work arena nurse";
let ftIssuer = mxw.Wallet.fromMnemonic(ftIssuerMnemonic).connect(
  providerConnection
);

const ftMiddlewareMnemonic =
  "police toilet cupboard song blanket duty wrestle public bike cattle install page option spell scout crop pig answer access alarm gain fish absent pen";
let ftMiddleware = mxw.Wallet.fromMnemonic(ftMiddlewareMnemonic).connect(
  providerConnection
);

//function
function authourize(perform, symbol, overrides) {
  return perform(symbol, provider, overrides)
    .then((transaction) => {
      return NonFungibleToken.signNonFungibleTokenStatusTransaction(
        transaction,
        issuer
      );
    })
    .then((transaction) => {
      return NonFungibleToken.sendNonFungibleTokenStatusTransaction(
        transaction,
        middleware
      );
    })
    .then((receipt) => {
      if (receipt.status == 1) console.log("success");
      else console.log("error");
      const hash = receipt.hash
      console.log(hash)
      return(hash);
    });
}

async function ftAuthourize(perform, symbol, overrides) {
  return perform(symbol, ftProvider, overrides)
    .then((transaction) => {
      return token.FungibleToken.signFungibleTokenStatusTransaction(
        transaction,
        ftIssuer
      );
    })
    .then((transaction) => {
      return token.FungibleToken.sendFungibleTokenStatusTransaction(
        transaction,
        ftMiddleware
      );
    })
    .then((receipt) => {
      if (receipt.status == 1) console.log("success");
      else console.log("error");
      const hash = receipt.hash
      console.log(hash)
      return(hash);
    });
}

function query(symbol) {
  return NonFungibleToken.fromSymbol(symbol, issuer).then(
    (nfToken) => {
      console.log(nfToken.symbol)
      return nfToken;
    }
  );
}



//route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/test", (req, res) => {
  res.send("Not  Here!");
});

app.get("/createFT", (req,res) =>{
  let symbol = hexlify(randomBytes(4)).substring(2);
  let fungibleTokenProperties = {
    name: "FT" + symbol,
    symbol: "FT-" + symbol,
    decimals: 18,
    fixedSupply: true,
    maxSupply: bigNumberify("10000000000000"),
    fee: {
      to: "mxw173qf9y2ae0cx8y07ez6qsl9k2gs2l5955hfc7x",
      value: bigNumberify("0"),
    },
    metadata: "",
  };
  let burnable = true;
  let overrides = {
    tokenFees: [
      { action: FungibleTokenActions.transfer, feeName: "default" },
      { action: FungibleTokenActions.transferOwnership, feeName: "default"},
      { action: FungibleTokenActions.acceptOwnership, feeName: "default" },
    ],
    burnable,
  };
  if (burnable) {
    overrides.tokenFees.push({
      action: FungibleTokenActions.burn,
      feeName: "transfer",
    });
  }
  token.FungibleToken.create(fungibleTokenProperties, ftIssuer).then(
    (fToken) => {
      console.log("Token had been created");
      return ftAuthourize(
        token.FungibleToken.approveFungibleToken,
        fToken.symbol,
        overrides
      );
    }
  );
})
app.get("/createNFT", (req, res) => {
  let symbol = hexlify(randomBytes(4)).substring(2);
  let nonFungibleTokenProperties = {
    // name: "Avatar" + symbol,
    // symbol: symbol,
    name: "Avatar" + "105",
    symbol: "105",
    fee: {
      to: "mxw1md4u2zxz2ne5vsf9t4uun7q2k0nc3ly5g22dne",
      value: bigNumberify("1"),
    },
    properties: "An original piece of art",
    metadata: "",
  };
  let overrides = {
    tokenFees: [
      { action: NonFungibleTokenActions.transfer, feeName: "default" },
      { action: NonFungibleTokenActions.transferOwnership, feeName: "default" },
      { action: NonFungibleTokenActions.acceptOwnership, feeName: "default"},
    ],
    endorserList: [],
    endorserListLimit: 10000,
    mintLimit: -1,
    transferLimit: 1,
    burnable: true,
    transferable: true,
    modifiable: true,
    pub: true,
  };
  return NonFungibleToken.create(nonFungibleTokenProperties, issuer).then((nft) => {
    const hash = authourize( NonFungibleToken.approveNonFungibleToken,nft.symbol,overrides);
    res.send(hash)
    return hash
  });
});

app.get("/mintNFT", (req, res) => {
  let id = hexlify(randomBytes(4)).substring(2);
  const itemProp = {
    symbol: "101",
    itemID: "Avatar" + id,
    properties: "Avatar for me",
    metadata: "Cool looking avatar",
  };
  let nft = new NonFungibleToken("100",middleware);
  nft.mint(middleware.address, itemProp).then((receipt) => {
    res.send(receipt);
  });
});

app.get("/lookUp", (req,res)=>{
  console.log(req.query.hash)
  providerConnection.getTransactionReceipt(req.query.hash).then((receipt)=>{
    res.send(receipt.payload.value.msg[0].value.owner);
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
