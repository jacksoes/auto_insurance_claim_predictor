
import json
from decimal import Decimal

import pymysql


def json_default(value):
    """Convert database numeric types into JSON-compatible values."""
    if isinstance(value, Decimal):
        return float(value)

    raise TypeError(f"Cannot serialize {type(value).__name__}")


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

        # Overall dashboard KPIs.
        summary_sql = """
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

        chart_queries = {
            # LINE CHARTS
            # These charts measure average values by incident hour.
            "claim_by_hour": """
                SELECT
                    incident_hour_of_the_day AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                WHERE incident_hour_of_the_day IS NOT NULL
                GROUP BY incident_hour_of_the_day
                ORDER BY incident_hour_of_the_day
            """,

            "vehicles_by_hour": """
                SELECT
                    incident_hour_of_the_day AS label,
                    AVG(number_of_vehicles_involved) AS value
                FROM insurance_claims_refined
                WHERE incident_hour_of_the_day IS NOT NULL
                GROUP BY incident_hour_of_the_day
                ORDER BY incident_hour_of_the_day
            """,

            "witnesses_by_hour": """
                SELECT
                    incident_hour_of_the_day AS label,
                    AVG(witnesses) AS value
                FROM insurance_claims_refined
                WHERE incident_hour_of_the_day IS NOT NULL
                GROUP BY incident_hour_of_the_day
                ORDER BY incident_hour_of_the_day
            """,

            # CATEGORY CHARTS
            # Every query below measures average claim payout in dollars.
            "education": """
                SELECT
                    COALESCE(
                        insured_education_level, 'Unknown'
                    ) AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                GROUP BY COALESCE(
                    insured_education_level, 'Unknown'
                )
                ORDER BY value DESC
            """,

            "vehicles": """
                SELECT
                    CAST(number_of_vehicles_involved AS CHAR)
                        AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                WHERE number_of_vehicles_involved IS NOT NULL
                GROUP BY number_of_vehicles_involved
                ORDER BY number_of_vehicles_involved
            """,

            "relationship": """
                SELECT
                    COALESCE(
                        insured_relationship, 'Unknown'
                    ) AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                GROUP BY COALESCE(
                    insured_relationship, 'Unknown'
                )
                ORDER BY value DESC
            """,

            "sex": """
                SELECT
                    COALESCE(insured_sex, 'Unknown') AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                GROUP BY COALESCE(insured_sex, 'Unknown')
                ORDER BY value DESC
            """,

            "incident_type": """
                SELECT
                    COALESCE(incident_type, 'Unknown') AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                GROUP BY COALESCE(incident_type, 'Unknown')
                ORDER BY value DESC
            """,

            "collision_type": """
                SELECT
                    COALESCE(collision_type, 'Unknown') AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                GROUP BY COALESCE(collision_type, 'Unknown')
                ORDER BY value DESC
            """,

            # NUMERIC FACTORS
            "age": """
                SELECT
                    age AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                WHERE age IS NOT NULL
                GROUP BY age
                ORDER BY age
            """,

            "customer_tenure": """
                SELECT
                    CONCAT(
                        tenure_group * 12,
                        '-',
                        tenure_group * 12 + 11,
                        ' months'
                    ) AS label,
                    value
                FROM (
                    SELECT
                        FLOOR(months_as_customer / 12)
                            AS tenure_group,
                        AVG(total_claim_amount) AS value
                    FROM insurance_claims_refined
                    WHERE months_as_customer IS NOT NULL
                    GROUP BY FLOOR(months_as_customer / 12)
                ) AS grouped_tenure
                ORDER BY tenure_group
            """,

            "bodily_injuries": """
                SELECT
                    bodily_injuries AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                WHERE bodily_injuries IS NOT NULL
                GROUP BY bodily_injuries
                ORDER BY bodily_injuries
            """,

            "deductible": """
                SELECT
                    policy_deductable AS label,
                    AVG(total_claim_amount) AS value
                FROM insurance_claims_refined
                WHERE policy_deductable IS NOT NULL
                GROUP BY policy_deductable
                ORDER BY policy_deductable
            """,

            "annual_premium": """
                SELECT
                    CONCAT(
                        '$',
                        premium_group * 500,
                        '-$',
                        premium_group * 500 + 499
                    ) AS label,
                    value
                FROM (
                    SELECT
                        FLOOR(policy_annual_premium / 500)
                            AS premium_group,
                        AVG(total_claim_amount) AS value
                    FROM insurance_claims_refined
                    WHERE policy_annual_premium IS NOT NULL
                    GROUP BY FLOOR(policy_annual_premium / 500)
                ) AS grouped_premium
                ORDER BY premium_group
            """,
        }

        with connection.cursor() as cursor:
            cursor.execute(summary_sql)
            summary = cursor.fetchone()

            charts = {}

            for chart_name, query in chart_queries.items():
                cursor.execute(query)
                rows = cursor.fetchall()

                charts[chart_name] = [
                    {
                        "label": row["label"],
                        "value": row["value"],
                    }
                    for row in rows
                ]

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(
                {
                    "summary": summary,
                    "charts": charts,
                },
                default=json_default,
            ),
        }

    except Exception as exc:
        print(f"Failed to retrieve claims analytics: {exc}")

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": "Failed to retrieve claims analytics"
            }),
        }

    finally:
        if connection:
            connection.close()
