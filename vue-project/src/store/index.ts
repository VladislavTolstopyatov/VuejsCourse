import {createStore} from 'vuex'

export default createStore(
    {
        state: {
            count: 0,
            selectedId: null
        },
        getters: {
            getCountX2: (state: any) => state.count * 2,
            getSelectedId: (state: any) => state.selectedId
        },
        mutations: {
            increment(state: any, payload: number = 1) {
                state.count += payload
            },
            select(state: any, id: any) {
                state.selectedId = id
            }
        },
        actions: {
            runIncrement: (store: any) => {
                store.commit("increment")
                store.commit("increment")
            }
        }
    }
)