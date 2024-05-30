import { useVirtualizer } from "@tanstack/react-virtual";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import {
	BehaviorSubject,
	Observable,
	Subscription,
	defer,
	from,
	map,
	switchMap,
	tap,
} from "rxjs";

function tapOnce<T>(fn: (value: T) => void) {
	return (source: Observable<T>) =>
		defer(() => {
			let first = true;
			return source.pipe(
				tap((payload) => {
					if (first) {
						fn(payload);
					}
					first = false;
				})
			);
		});
}

function App() {
	// Handle fetch data
	const [allRows, setAllRows] = useState<string[]>([]);
	const subscriptions = useRef<Subscription[]>([]);
	const page = useRef(0);
	const addingNewPage = useRef(false);

	const createPageSubscription = (page: number) => {
		console.log("Oke");

		const changeSubject = new BehaviorSubject(0);
		setInterval(() => {
			changeSubject.next(changeSubject.value + 1);
		}, 1000);
		addingNewPage.current = true;
		return changeSubject
			.pipe(
				switchMap((changed) => {
					console.log("Hmmm");

					return from(
						new Promise((resolve) =>
							setTimeout(() => {
								console.log("KKK");
								resolve(undefined);
							}, 500)
						)
					).pipe(
						tapOnce(() => {
							addingNewPage.current = false;
						}),
						map(() => changed)
					);
				})
			)
			.subscribe((changed) => {
				setAllRows((prev) => {
					const newRows = prev.slice(0);
					newRows.splice(
						page * 100000,
						100000,
						...Array(100000)
							.fill(0)
							.map(
								(_, index) =>
									"Item " + (page * 100000 + index) + " - " + changed
							)
					);

					return newRows;
				});
			});
	};

	const addPage = () => {
		if (addingNewPage.current) {
			return;
		}
		createPageSubscription(page.current);
		page.current += 1;
	};

	useEffect(() => {
		return () => {
			subscriptions.current.forEach((subscription) =>
				subscription.unsubscribe()
			);
			subscriptions.current = [];
		};
	}, []);

	// Handle scrolling
	const parentRef = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: 100000,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 30,
		overscan: 20,
	});

	return (
		<div
			ref={parentRef}
			className="List"
			style={{
				height: `500px`,
				width: `500px`,
				overflow: "auto",
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const post = allRows[virtualRow.index];

					if (!post) {
						addPage();
						return null;
					}

					return (
						<div
							key={post}
							className={virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven"}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							{post}
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default App;
