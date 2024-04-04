import { useReducer } from 'react';
import { useCallback } from 'react';
import { useContext } from 'react';
import { createContext, useState, useEffect } from 'react';

const BASE_URL = 'http://localhost:8000';

const CitiesContext = createContext();

const initialState = {
	cities: [],
	isLoading: false,
	currentCity: {},
	error: '',
};

function reducer(state, action) {
	switch (action.type) {
		case 'loading':
			return { ...state, isLoading: true };
		case 'cities/loaded':
			return { ...state, isLoading: false, cities: action.payload };
		case 'currentCity/loaded':
			return { ...state, isLoading: false, currentCity: action.payload };
		case 'city/created':
			return { ...state, isLoading: false, cities: [...state.cities, action.payload], currentCity: action.payload };
		case 'city/deleted':
			return { ...state, isLoading: false, cities: state.cities.filter((city) => city.id !== action.payload), currentCity: {} };
		case 'rejected':
			return { ...state, isLoading: false, error: action.payload };
		default:
			throw new Error('Unknown action type');
	}
}

function CitiesProvider({ children }) {
	const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(reducer, initialState);

	useEffect(function () {
		async function fetchCities() {
			dispatch({ type: 'loading' });
			try {
				const res = await fetch(`${BASE_URL}/cities`);
				const data = await res.json();
				dispatch({ type: 'cities/loaded', payload: data });
			} catch (error) {
				dispatch({ type: 'rejected', payload: 'There was an error loading the cities...' });
			}
		}

		fetchCities();
	}, []);

	const getCity = useCallback(
		async function (id) {
			if (Number(id) === currentCity.id) return;
			dispatch({ type: 'loading' });

			try {
				const res = await fetch(`${BASE_URL}/cities/${id}`);
				const data = await res.json();
				dispatch({ type: 'currentCity/loaded', payload: data });
			} catch (error) {
				dispatch({ type: 'rejected', payload: 'There was an error loading the city...' });
			}
		},
		[currentCity.id],
	);

	async function createCity(city) {
		dispatch({ type: 'loading' });
		try {
			const res = await fetch(`${BASE_URL}/cities`, {
				method: 'POST',
				body: JSON.stringify(city),
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await res.json();
			dispatch({ type: 'city/created', payload: data });
		} catch (error) {
			dispatch({ type: 'rejected', payload: 'There was an error creating the city...' });
		}
	}

	async function deleteCity(id) {
		dispatch({ type: 'loading' });
		try {
			await fetch(`${BASE_URL}/cities/${id}`, { method: 'DELETE' });
			dispatch({ type: 'city/deleted', payload: id });
		} catch (error) {
			dispatch({ type: 'rejected', payload: 'There was an error deleting the city...' });
		}
	}

	return (
		<CitiesContext.Provider value={{ cities, isLoading, currentCity, getCity, createCity, deleteCity, error }}>
			{children}
		</CitiesContext.Provider>
	);
}

function useCities() {
	const context = useContext(CitiesContext);
	if (context === undefined) throw new Error('CitiesContext was used outside of the CitiesProvider');
	return context;
}

export { CitiesProvider, useCities };
