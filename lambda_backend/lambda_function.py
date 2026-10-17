
import json
import pymysql


def lambda_handler(event, context):
    connection = None

    try:
        connection = pymysql.connect(
            host="localhost",
            user="root",
            password="password",
            database="claims_data",
            port=3306,
            connect_timeout=5,
            cursorclass=pymysql.cursors.DictCursor,
        )

        query = """
            SELECT
                COUNT(*) AS total_claims,
                COALESCE(SUM(total_claim_amount), 0)
                    AS total_claim_amount,
                AVG(total_claim_amount)
                    AS average_claim_amount,
                COALESCE(SUM(
                    CASE
                        WHEN UPPER(insured_sex) = 'MALE'
                        THEN 1 ELSE 0
                    END
                ), 0) AS male_count,
                COALESCE(SUM(
                    CASE
                        WHEN UPPER(insured_sex) = 'FEMALE'
                        THEN 1 ELSE 0
                    END
                ), 0) AS female_count
            FROM insurance_claims_refined
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchone()

        # Convert MySQL Decimal values to JSON-compatible numbers.
        for key, value in results.items():
            if value is not None:
                if key in (
                    "total_claim_amount",
                    "average_claim_amount",
                ):
                    results[key] = float(value)
                else:
                    results[key] = int(value)

        print("Claims summary retrieved successfully")

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(results),
        }

    except Exception:
        print("Failed to retrieve claims summary")

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": "Failed to retrieve claims summary"
            }),
        }

    finally:
        if connection:
            connection.close()
