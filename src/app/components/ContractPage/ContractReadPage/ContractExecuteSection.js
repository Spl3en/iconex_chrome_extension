import React, { Component } from 'react';
import {  LoadingComponent, InputText, InputBoolean, Output } from 'app/components/';
import { WalletSelectorContainer, TxFeeAndDataContainer, CalculationTableContainer, QuantitySetterContainer } from 'app/containers';
import withLanguageProps from 'HOC/withLanguageProps';

const INIT_STATE = {
}

@withLanguageProps
class ContractExecuteSection extends Component {

  constructor(props) {
    super(props);
    this.state = INIT_STATE
  }

  componentDidMount() {
    const { funcList, selectedFuncIndex } = this.props;
    if (funcList[selectedFuncIndex].inputs.length < 1 && funcList[selectedFuncIndex].readonly) {
      this.props.executeFunc();
    }
  }

  componentWillReceiveProps(nextProps) {
    const { funcList, selectedFuncIndex } = nextProps;
    if (this.props.selectedFuncIndex !== selectedFuncIndex) {
      nextProps.resetEXTRPageReducer();
      if (funcList[selectedFuncIndex].inputs.length < 1 && funcList[selectedFuncIndex].readonly) {
        nextProps.executeFunc();
      }
    }
  }

  renderInputSwitch = (input) => {
    const {
      funcInputState,
      funcInputError,
      handleFuncInputChange,
      setFuncInputError,
      I18n } = this.props;
    const value = funcInputState[input.name];
    const error = I18n.error[funcInputError[input.name]];
    switch (input.type) {
      case 'bytes':
      case 'Address':
      case 'str':
      case 'int':
        return <InputText
                {...{
                  input,
                  value,
                  error,
                  setFuncInputError,
                  handleFuncInputChange
                }}
                key={input.name}
                placeHolder={I18n[`contract${input.type}InputPlaceHolder`]}
                />
      case 'bool':
        return <InputBoolean
                {...{
                  input,
                  value,
                  error,
                  handleFuncInputChange
                }}
                key={input.name}
                />
      default:
        return ''
    }
  }

  render() {
    const {
      I18n,
      funcList,
      selectedFuncIndex,
      funcLoading,
      funcResult,
    } = this.props;

    const { inputs, outputs, readonly } = funcList[selectedFuncIndex];

    return (
      <div>
        <span className="name-group">
          {
            inputs.map((input) => {
              return this.renderInputSwitch(input)
            })
          }
          { !readonly && ( <WalletSelectorInput {...this.props}/> )}
          {
            funcLoading ? (
              <button style={{width: 99.45}} className="btn-type-fill3"><LoadingComponent type='white' /></button>
            ) : (
              <button onClick={() => this.props.checkContractInputError()} className="btn-type-fill3">
                <span>{ readonly ? I18n.button.read : I18n.button.write }</span>
              </button>
            )
          }
        </span>
        {
          readonly && funcResult.length > 0 && (
            <span className="result-group">
              <ul>
                {
                  outputs.map((output, i) => {
                    return (
                      <Output
                        {...{
                          output
                        }}
                        key={i}
                        value={funcResult[i]}
                        />
                    );
                  })
                }
              </ul>
            </span>
          )
        }
      </div>
    );
  }
}

class WalletSelectorInput extends Component {
  render() {
    const {
      isLoggedIn,
      funcList,
      selectedFuncIndex,
    } = this.props;

    const { payable = '' } = funcList[selectedFuncIndex];
    console.log(funcList[selectedFuncIndex])

    return (
      <div>
        <WalletSelectorContainer isContractPage={true} />
        { isLoggedIn && payable && (<QuantitySetterContainer isContractPage={true} />) }
        { isLoggedIn && (<TxFeeAndDataContainer isContractPage={true} />) }
        { isLoggedIn && (<CalculationTableContainer isContractPage={true} />) }
      </div>
    )
  }
}


export default ContractExecuteSection;
