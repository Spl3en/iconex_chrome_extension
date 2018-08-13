import React, { Component } from 'react';
import { CheckPassword } from 'app/components/';
import Wallet from 'ethereumjs-wallet';
import { Alert } from 'app/components/';

const INIT_STATE = {
  showAlertAddressSame: false,
  sameWalletName: ''
}

class SwapToken1 extends Component {

  constructor(props) {
    super(props);
    this.state = INIT_STATE;
  }

  closePopup = () => {
    this.setState(INIT_STATE);
    this.props.resetSelectedWallet();
    this.props.closePopup();
  }

  handleSuccess = (privKey) => {
    new Promise(resolve => {
      const wallet = Wallet.fromPrivateKey(Buffer(privKey, 'hex'));
      resolve(wallet);
    }).then(result => {

      const { wallets } = this.props;
      const key = result.getAddressIcx().toString('hex')

      if (wallets[key]) {
        this.props.setIcxSwapAddress(key)
        this.props.setPrivKeyForSwap(privKey);
        this.props.setEXTRLogInState({isLoggedIn: true, privKey: privKey});
        this.props.checkSwapWalletExist(true);
        this.props.setPopupNum(2);
        return;
        // ** swap function
        // if (isDevelopment) {
        //   this.props.setIcxSwapAddress(key)
        //   this.props.setPrivKeyForSwap(privKey);
        //   this.props.setEXTRLogInState({isLoggedIn: true, privKey: privKey});
        //   this.props.setPopupNum(6);
        // }
        // else {
        //   this.setState({
        //     showAlertAddressSame: true,
        //     sameWalletName: wallets[key].name
        //   })
        // }
        // return;
      }

      this.props.setPrivKeyForSwap(privKey);
      this.props.setEXTRLogInState({isLoggedIn: true, privKey: privKey});
      this.setState({
        wallet: result,
      }, () => {
        this.props.setWalletObject(result);
        this.props.setAddress(key);
        this.props.setCoinType('icx')
        this.props.setPopupNum(2);
      })
    })
  }

  render() {
    const {showAlertAddressSame, sameWalletName} = this.state
    const {
      I18n, wallets, selectedAccount
    } = this.props;

    const name = wallets[selectedAccount].name;
    const priv = wallets[selectedAccount].priv;

    return (
      <div className="popup size-medium2">
        <CheckPassword type="sendTransaction" walletName={name} priv={priv} onCancel={this.closePopup} onSuccess={this.handleSuccess} />
        {
          showAlertAddressSame && (
            <Alert
              handleSubmit={this.closePopup}
              text={`${I18n.swapToken.alertSameWallet1} ${sameWalletName}${I18n.swapToken.alertSameWallet2}`}
              submitText={I18n.button.confirm}
            />
          )
        }
      </div>
    );
  }
}


export default SwapToken1;
