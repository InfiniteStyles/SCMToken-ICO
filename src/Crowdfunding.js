import React, { Component } from "react";
import Crowdfunding from "../build/contracts/Crowdfunding.json";
const contract = require("truffle-contract");
import getWeb3 from "./utils/getWeb3";

export default class CrowdfundingContract extends Component {
  constructor(props) {
    super(props);
    this.state = {
      icoStatus: null,
      account: null,
      purchaseField: 0,
      claimableBalance: "Loading"
    };

    this.instantiateCrowdfunding = this.instantiateCrowdfunding.bind(this);
    this.allowTransfers = this.allowTransfers.bind(this);
    this.retrieveICOStatus = this.retrieveICOStatus.bind(this);
    this.purchaseSCM = this.purchaseSCM.bind(this);
    this.claimSCM = this.claimSCM.bind(this);
    this.handlePurchaseField = this.handlePurchaseField.bind(this);
    this.claimableBalance = this.claimableBalance.bind(this);
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.
    getWeb3
      .then(results => {
        this.setState(
          {
            web3: results.web3
          },
          () => {
            this.setState(
              {
                account: this.state.web3.eth.accounts[0]
              },
              () => {
                this.instantiateCrowdfunding();
                this.allowTransfers();
                setInterval(this.retrieveICOStatus, 3000);
                setInterval(this.claimableBalance, 3000);
              }
            );
          }
        );
        // Instantiate contracts once web3 provided.
      })
      .catch(() => {
        console.log("Error finding web3.");
      });
  }

  handlePurchaseField(e) {
    e.preventDefault();
    this.setState({
      purchaseField: e.target.value
    });
  }

  instantiateCrowdfunding() {
    let crowdfundingContract = contract(Crowdfunding);
    crowdfundingContract.setProvider(this.state.web3.currentProvider);
    return crowdfundingContract.deployed();
  }

  allowTransfers() {
    const crowdfundingInstance = this.instantiateCrowdfunding;
    crowdfundingInstance().then(contract => {
      this.props.weth().then(wethInstance => {
        return wethInstance
          .approve(contract.address, 1000000000000000000000000, {
            from: this.state.account
          })
          .then(res => {
            console.log("approval response", res);
          })
          .catch(err => {
            console.log("Weth instance never approved the ICO address.");
          });
      });
    });
  }

  retrieveICOStatus() {
    const crowdfundingInstance = this.instantiateCrowdfunding;
    crowdfundingInstance().then(contract => {
      contract.active().then(result => {
        if (result === true) {
          this.setState({
            icoStatus: "ACTIVE"
          });
        } else {
          this.setState({
            icoStatus: "FINISHED"
          });
        }
      });
    });
  }

  purchaseSCM() {
    this.instantiateCrowdfunding().then(contract => {
      contract
        .purchase(Number(this.state.purchaseField), {
          from: this.state.account
        })
        .then(result => {
          console.log(result);
        });
    });
  }

  claimSCM() {
    this.instantiateCrowdfunding().then(contract => {
      contract
        .withdraw({
          from: this.state.account
        })
        .then(result => {
          console.log(result);
        });
    });
  }

  claimableBalance() {
    this.instantiateCrowdfunding()
      .then(contract => {
        return contract.balances(this.state.account);
      })
      .then(balance => {
        if (typeof balance === "object") {
          balance = balance.toNumber();
        }
        this.setState({
          claimableBalance: balance
        });
      })
      .catch(err => {
        "Unable to get the balance";
      });
  }

  render() {
    return (
      <div>
        <h2>Purchase Tokens</h2>
        <p>
          Current Balance:   {this.state.claimableBalance}
        </p>
        <p>ICO Status: {this.state.icoStatus || "Uknown"}</p>
  
        <p>Balance is only claimable once the ICO Status is: FINISHED</p>
        <input
          type="text"
          onChange={this.handlePurchaseField}
          value={this.state.purchaseField}
        />
        <button onClick={this.purchaseSCM}>Purchase SCM Tokens</button>
        <h2>Claim Tokens</h2>
        <button onClick={this.claimSCM}>Claim SCM Tokens!</button>
      </div>
    );
  }
}
