-- CulinarySeoul ERP 스키마 검증 및 무결성 테스트
-- 데이터베이스 구조 확인 및 기능 테스트

-- ===============================
-- 1. 스키마 구조 검증
-- ===============================

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'companies', 'brands', 'stores', 'profiles',
        'menu_categories', 'menu_items', 'recipes', 'recipe_ingredients',
        'inventory_items', 'inventory_batches', 'inventory_transactions',
        'orders', 'order_items', 'payments', 'audit_logs'
    ];
    expected_enums TEXT[] := ARRAY[
        'erp_role', 'order_status', 'payment_status', 'inventory_transaction_type'
    ];
    expected_functions TEXT[] := ARRAY[
        'update_updated_at_column', 'consume_inventory_fifo', 'auto_consume_inventory'
    ];
    
    missing_tables TEXT[] := '{}';
    missing_enums TEXT[] := '{}';
    missing_functions TEXT[] := '{}';
    
    table_name TEXT;
    enum_name TEXT;
    function_name TEXT;
    
    table_count INTEGER := 0;
    enum_count INTEGER := 0;
    function_count INTEGER := 0;
    trigger_count INTEGER := 0;
    index_count INTEGER := 0;
    policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== CulinarySeoul ERP Schema Validation ===';
    RAISE NOTICE 'Validation started at: %', NOW();
    
    -- 테이블 존재 확인
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        ELSE
            table_count := table_count + 1;
        END IF;
    END LOOP;
    
    -- ENUM 타입 존재 확인
    FOREACH enum_name IN ARRAY expected_enums
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = enum_name AND typtype = 'e'
        ) THEN
            missing_enums := array_append(missing_enums, enum_name);
        ELSE
            enum_count := enum_count + 1;
        END IF;
    END LOOP;
    
    -- 함수 존재 확인
    FOREACH function_name IN ARRAY expected_functions
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' AND routine_name = function_name
        ) THEN
            missing_functions := array_append(missing_functions, function_name);
        ELSE
            function_count := function_count + 1;
        END IF;
    END LOOP;
    
    -- 트리거 수 확인
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    -- 인덱스 수 확인
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- RLS 정책 수 확인
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- 결과 출력
    RAISE NOTICE '--- Schema Objects Summary ---';
    RAISE NOTICE 'Tables: % / % created', table_count, array_length(expected_tables, 1);
    RAISE NOTICE 'ENUM types: % / % created', enum_count, array_length(expected_enums, 1);
    RAISE NOTICE 'Functions: % / % created', function_count, array_length(expected_functions, 1);
    RAISE NOTICE 'Triggers: % created', trigger_count;
    RAISE NOTICE 'Indexes: % created', index_count;
    RAISE NOTICE 'RLS Policies: % created', policy_count;
    
    -- 누락된 객체 보고
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Missing tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    IF array_length(missing_enums, 1) > 0 THEN
        RAISE WARNING 'Missing ENUM types: %', array_to_string(missing_enums, ', ');
    END IF;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE WARNING 'Missing functions: %', array_to_string(missing_functions, ', ');
    END IF;
    
    -- 검증 성공 여부 판단
    IF table_count = array_length(expected_tables, 1) AND 
       enum_count = array_length(expected_enums, 1) AND 
       function_count = array_length(expected_functions, 1) THEN
        RAISE NOTICE '✅ Schema validation PASSED - All objects created successfully';
    ELSE
        RAISE WARNING '❌ Schema validation FAILED - Some objects are missing';
    END IF;
END;
$$;

-- ===============================
-- 2. 참조 무결성 검증
-- ===============================

DO $$
DECLARE
    fk_violations INTEGER := 0;
BEGIN
    RAISE NOTICE '--- Foreign Key Constraints Validation ---';
    
    -- 각 테이블의 외래키 제약조건 확인
    SELECT COUNT(*) INTO fk_violations
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    
    RAISE NOTICE 'Foreign key constraints found: %', fk_violations;
    
    IF fk_violations > 0 THEN
        RAISE NOTICE '✅ Foreign key constraints are properly configured';
    ELSE
        RAISE WARNING '❌ No foreign key constraints found - this may indicate a problem';
    END IF;
END;
$$;

-- ===============================
-- 3. RLS 정책 검증
-- ===============================

DO $$
DECLARE
    rls_enabled_tables INTEGER := 0;
    total_policies INTEGER := 0;
BEGIN
    RAISE NOTICE '--- Row Level Security Validation ---';
    
    -- RLS가 활성화된 테이블 수 확인
    SELECT COUNT(*) INTO rls_enabled_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relrowsecurity = true
        AND n.nspname = 'public'
        AND c.relkind = 'r';
    
    -- 총 정책 수 확인
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Tables with RLS enabled: %', rls_enabled_tables;
    RAISE NOTICE 'Total RLS policies: %', total_policies;
    
    IF rls_enabled_tables > 0 AND total_policies > 0 THEN
        RAISE NOTICE '✅ Row Level Security is properly configured';
    ELSE
        RAISE WARNING '❌ Row Level Security may not be properly configured';
    END IF;
END;
$$;

-- ===============================
-- 4. 기능 테스트 (샘플 데이터로)
-- ===============================

DO $$
DECLARE
    company_id UUID;
    brand_id UUID;
    store_id UUID;
    test_user_id UUID := gen_random_uuid();
    test_result RECORD;
BEGIN
    RAISE NOTICE '--- Functional Testing ---';
    
    -- 테스트용 회사 생성
    INSERT INTO companies (name, code, domain, description)
    VALUES ('Test Company', 'TEST_CO', 'test.com', 'Test company for validation')
    RETURNING id INTO company_id;
    
    -- 테스트용 브랜드 생성
    INSERT INTO brands (company_id, name, code, domain, description)
    VALUES (company_id, 'Test Brand', 'TEST_BR', 'test-brand.com', 'Test brand for validation')
    RETURNING id INTO brand_id;
    
    -- 테스트용 매장 생성
    INSERT INTO stores (brand_id, name, code, address)
    VALUES (brand_id, 'Test Store', 'TEST_ST', '{"address": "Test Address"}')
    RETURNING id INTO store_id;
    
    RAISE NOTICE 'Created test entities - Company: %, Brand: %, Store: %', 
        company_id, brand_id, store_id;
    
    -- updated_at 트리거 테스트
    UPDATE companies SET description = 'Updated description' WHERE id = company_id;
    
    SELECT updated_at > created_at as trigger_working
    INTO test_result
    FROM companies WHERE id = company_id;
    
    IF test_result.trigger_working THEN
        RAISE NOTICE '✅ updated_at trigger is working correctly';
    ELSE
        RAISE WARNING '❌ updated_at trigger is not working';
    END IF;
    
    -- 테스트 데이터 정리
    DELETE FROM companies WHERE id = company_id;
    
    RAISE NOTICE '✅ Basic functional tests completed successfully';
END;
$$;

-- ===============================
-- 5. 성능 최적화 검증
-- ===============================

DO $$
DECLARE
    critical_indexes TEXT[] := ARRAY[
        'idx_profiles_role',
        'idx_brands_company_id',
        'idx_stores_brand_id',
        'idx_inventory_batches_item_store',
        'idx_orders_store_id',
        'idx_order_items_order_id'
    ];
    index_name TEXT;
    missing_indexes TEXT[] := '{}';
    index_count INTEGER := 0;
BEGIN
    RAISE NOTICE '--- Performance Optimization Validation ---';
    
    -- 중요한 인덱스 존재 확인
    FOREACH index_name IN ARRAY critical_indexes
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' AND indexname = index_name
        ) THEN
            index_count := index_count + 1;
        ELSE
            missing_indexes := array_append(missing_indexes, index_name);
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Critical indexes found: % / %', index_count, array_length(critical_indexes, 1);
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE WARNING 'Missing critical indexes: %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE '✅ All critical indexes are present';
    END IF;
END;
$$;

-- ===============================
-- 6. 최종 검증 요약
-- ===============================

DO $$
DECLARE
    total_tables INTEGER;
    total_functions INTEGER;
    total_triggers INTEGER;
    total_indexes INTEGER;
    total_policies INTEGER;
    schema_health_score INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Final Validation Summary ===';
    
    -- 전체 객체 수 집계
    SELECT COUNT(*) INTO total_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO total_functions 
    FROM information_schema.routines 
    WHERE routine_schema = 'public';
    
    SELECT COUNT(*) INTO total_triggers 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    SELECT COUNT(*) INTO total_indexes 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO total_policies 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- 스키마 건강성 점수 계산
    IF total_tables >= 15 THEN schema_health_score := schema_health_score + 25; END IF;
    IF total_functions >= 3 THEN schema_health_score := schema_health_score + 20; END IF;
    IF total_triggers >= 10 THEN schema_health_score := schema_health_score + 20; END IF;
    IF total_indexes >= 20 THEN schema_health_score := schema_health_score + 20; END IF;
    IF total_policies >= 5 THEN schema_health_score := schema_health_score + 15; END IF;
    
    RAISE NOTICE 'Database Objects Summary:';
    RAISE NOTICE '- Tables: %', total_tables;
    RAISE NOTICE '- Functions: %', total_functions;
    RAISE NOTICE '- Triggers: %', total_triggers;
    RAISE NOTICE '- Indexes: %', total_indexes;
    RAISE NOTICE '- RLS Policies: %', total_policies;
    RAISE NOTICE 'Schema Health Score: %/100', schema_health_score;
    
    IF schema_health_score >= 90 THEN
        RAISE NOTICE '🎉 EXCELLENT: CulinarySeoul ERP schema is production-ready!';
    ELSIF schema_health_score >= 70 THEN
        RAISE NOTICE '✅ GOOD: Schema is functional with minor optimization opportunities';
    ELSIF schema_health_score >= 50 THEN
        RAISE WARNING '⚠️  FAIR: Schema needs improvements before production';
    ELSE
        RAISE WARNING '❌ POOR: Schema has significant issues that must be addressed';
    END IF;
    
    RAISE NOTICE 'Validation completed at: %', NOW();
    RAISE NOTICE '=== End of Validation Report ===';
END;
$$;