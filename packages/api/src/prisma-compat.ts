import { Prisma } from "@rythmons/db";

type QueryableClient = {
	$queryRaw: <T = unknown>(query: Prisma.Sql) => Promise<T>;
};

type ColumnRow = {
	column_name: string;
};

const tableColumnsCache = new Map<string, Promise<Set<string>>>();

async function getTableColumns(
	client: QueryableClient,
	tableName: string,
): Promise<Set<string>> {
	const cachedColumns = tableColumnsCache.get(tableName);

	if (cachedColumns) {
		return cachedColumns;
	}

	const columnsPromise = client
		.$queryRaw<ColumnRow[]>(Prisma.sql`
			SELECT column_name
			FROM information_schema.columns
			WHERE table_schema = current_schema()
				AND table_name = ${tableName}
		`)
		.then((rows) => new Set(rows.map((row) => row.column_name)))
		.catch(() => new Set<string>());

	tableColumnsCache.set(tableName, columnsPromise);

	return columnsPromise;
}

export async function getColumnAvailability<
	const TColumns extends readonly string[],
>(
	client: QueryableClient,
	tableName: string,
	columnNames: TColumns,
): Promise<Record<TColumns[number], boolean>> {
	const availableColumns = await getTableColumns(client, tableName);

	return Object.fromEntries(
		columnNames.map((columnName) => [
			columnName,
			availableColumns.has(columnName),
		]),
	) as Record<TColumns[number], boolean>;
}
