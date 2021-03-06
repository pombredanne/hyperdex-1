import electron from 'electron';
import React from 'react';
import _ from 'lodash';
import {Subscribe} from 'unstated';
import appContainer from 'containers/App';
import Input from 'components/Input';
import CurrencySelectOption from 'components/CurrencySelectOption';
import Select from 'components/Select';
import {getCurrencySymbols, getCurrencyName} from '../../marketmaker/supported-currencies';
import {isDevelopment} from '../../util-common';
import {alwaysEnabledCurrencies} from '../../constants';
import TabView from './TabView';
import './Settings.scss';

const config = electron.remote.require('./config');

class CurrencySelection extends React.Component {
	handleSelectChange = options => {
		const enabledCurrencies = appContainer.state.enabledCoins;
		const newCurrencies = options.map(x => x.value);

		// We have to do our own diffing as `react-select` just returns the new `value` array
		const [added] = _.difference(newCurrencies, enabledCurrencies);
		if (added) {
			appContainer.enableCurrency(added);
		} else {
			const [removed] = _.difference(enabledCurrencies, newCurrencies);
			appContainer.disableCoin(removed);
		}
	};

	render() {
		const excludedCurrencies = isDevelopment ? [] : ['PIZZA', 'BEER'];
		const currencySymbols = _.without(getCurrencySymbols(), ...excludedCurrencies);

		const selectData = currencySymbols.map(symbol => ({
			label: `${getCurrencyName(symbol)} (${symbol})`,
			value: symbol,
			clearableValue: !alwaysEnabledCurrencies.includes(symbol),
		}));

		return (
			<div className="form-group">
				<label>
					Enabled Currencies:
				</label>
				<Select
					className="enabled-currencies"
					multi
					searchable
					value={appContainer.state.enabledCoins}
					options={selectData}
					onChange={this.handleSelectChange}
					valueRenderer={CurrencySelectOption}
					optionRenderer={CurrencySelectOption}
				/>
			</div>
		);
	}
}

class Form extends React.Component {
	state = {
		marketmakerUrl: config.get('marketmakerUrl') || '',
	};

	persistState = _.debounce((name, value) => {
		config.set(name, value);
	}, 500);

	handleChange = (value, event) => {
		const {name} = event.target;
		this.setState({[name]: value});
		this.persistState(name, value);
	};

	render() {
		const isValidMarketmakerUrl = this.state.marketmakerUrl.length < 1 || /^https?:\/\/.{4}/.test(this.state.marketmakerUrl);

		return (
			<React.Fragment>
				<CurrencySelection/>
				<div className="form-group">
					<h3>Advanced</h3>
					<label htmlFor="marketmakerUrl">
						Custom Marketmaker URL: <small>(Requires app restart)</small>
					</label>
					<Input
						name="marketmakerUrl"
						value={this.state.marketmakerUrl}
						onChange={this.handleChange}
						onBlur={() => {
							if (!isValidMarketmakerUrl) {
								this.setState({marketmakerUrl: ''});
							}
						}}
						placeholder="Example: http://localhost:7783"
						errorMessage={!isValidMarketmakerUrl && 'Invalid URL'}
					/>
				</div>
			</React.Fragment>
		);
	}
}

const Settings = () => (
	<Subscribe to={[appContainer]}>
		{() => (
			<TabView title="Settings" className="Settings">
				<header>
					<h2>Settings</h2>
				</header>
				<main>
					<Form/>
				</main>
			</TabView>
		)}
	</Subscribe>
);

export default Settings;
