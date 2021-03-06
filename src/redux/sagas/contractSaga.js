import { fork, put, takeLatest, call, select, all } from 'redux-saga/effects'
import AT from 'redux/actionTypes/actionTypes';
import {
  icx_getScoreApi as GET_SCORE,
  icx_call as ICX_CALL,
  icx_sendTransaction as ICX_SEND_TRANSACTION
} from 'redux/api/walletIcxApi'
import { validateInputError } from 'redux/reducers/contractReducer'
import { validateCoinQuantityError, validateContractGasLimitError } from 'redux/reducers/exchangeTransactionReducer'
import { openPopup } from 'redux/actions/popupActions'
import { executeFunc, setFuncInputError } from 'redux/actions/contractActions'
import { setWalletSelectorError, setCoinQuantityError, setContractGasLimitError } from 'redux/actions/exchangeTransactionActions'
import { makeIcxRawTx, signRawTx } from 'utils'

export function* executeFuncFunc(action) {
  let payload, funcInputHex;
  const selectedAccount = yield select(state => state.wallet.selectedWallet.account);
  const contractAddress = yield select(state => state.contract.contractAddress);
  const funcList = yield select(state => state.contract.funcList);
  const funcInput = yield select(state => state.contract.funcInput);
  const selectedFuncIndex = yield select(state => state.contract.selectedFuncIndex);
  const func = funcList[selectedFuncIndex]

  try {
    if (func.inputs.length > 0) {
      /* delete null value & convert int to hex */
      funcInputHex = func.inputs.reduce((acc, cur) => {
        if (cur.hasOwnProperty('default') && !funcInput[cur.name]) {
          return acc
        }
        if (cur.type === 'int') {
          acc[cur.name] = window.web3.toHex(funcInput[cur.name])
        } else {
          acc[cur.name] = funcInput[cur.name]
        }
        return acc
      }, {});
    }

    if (func.readonly) {
      payload = yield call(ICX_CALL, {
        contractAddress,
        methodName: func['name'],
        inputObj: funcInputHex
      });
    } else {
      const privKey = yield select(state => state.exchangeTransaction.privKey);
      const gasLimit = yield select(state => state.exchangeTransaction.gasLimit);
      const rawTx = makeIcxRawTx(true, {
        from: selectedAccount,
        gasLimit,
        contractAddress,
        methodName: func['name'],
        inputObj: funcInputHex
      });
      const rawTxSigned = signRawTx(privKey, rawTx)
      payload = yield call(ICX_SEND_TRANSACTION, rawTxSigned);
    }
    yield put({type: AT.executeFuncFulfilled, payload: [payload]});
  } catch (error) {
    console.log(error)
    yield put({type: AT.executeFuncRejected, error});
  }
}

export function* checkContractInputErrorFunc(action) {
  let isLoggedIn, gasLimit, calcData, coinQuantity;
  const funcList = yield select(state => state.contract.funcList);
  const selectedFuncIndex = yield select(state => state.contract.selectedFuncIndex);
  const func = funcList[selectedFuncIndex]

  try {
    let errorFlag = false;
    /* Input Error Handling */
    if (func.inputs.length > 0) {
      const errorArr = yield all(func.inputs.map(input => {
        const inputObj = {
          name: input.name,
          type: input.type,
          optional: input.hasOwnProperty('default') ? true : false
        }
        const error = validateInputError(inputObj)
        if (error) errorFlag = true;
        return {
          ...inputObj,
          error: error
        }
      }));
      yield all(errorArr.map((errorObj) =>
        put(setFuncInputError(errorObj))
      ))
    }

    if (!func.readonly) {
      isLoggedIn = yield select(state => state.exchangeTransaction.isLoggedIn);
      gasLimit = yield select(state => state.exchangeTransaction.gasLimit);
      coinQuantity = yield select(state => state.exchangeTransaction.coinQuantity);
      calcData = yield select(state => state.exchangeTransaction.calcData);
      if (!isLoggedIn) {
        yield put(setWalletSelectorError());
        errorFlag = true;
      } else if (validateCoinQuantityError({coinQuantity, calcData})) {
        yield put(setCoinQuantityError());
        errorFlag = true;
      } else if (validateContractGasLimitError({gasLimit, calcData})) {
        yield put(setContractGasLimitError());
        errorFlag = true;
      }
    }

    if (errorFlag) throw new Error('errorExist');

    if (func.readonly) {
      yield put(executeFunc())
    } else {
      yield put(openPopup({
        popupType: 'sendTransaction_contract',
        popupNum: 2
      }))
    }
  } catch (error) {
    console.log(error)
    yield put({type: AT.executeFuncRejected, error});
  }
}

export function* fetchAbiFunc(action) {
  try {
    const payloadArr = yield call(GET_SCORE, action.payload);
    const payload = JSON.stringify(payloadArr);
    yield put({type: AT.fetchAbiFulfilled, payload});
  } catch (error) {
    yield put({type: AT.fetchAbiRejected, error});
  }
}

function* watchCheckContractInputError() {
  yield takeLatest(AT.checkContractInputError, checkContractInputErrorFunc)
}

function* watchExecuteFunc() {
  yield takeLatest(AT.executeFunc, executeFuncFunc)
}

function* watchFetchAbi() {
  yield takeLatest(AT.fetchAbi, fetchAbiFunc)
}

export default function* contractSaga() {
 yield fork(watchFetchAbi);
 yield fork(watchExecuteFunc);
 yield fork(watchCheckContractInputError);
}
